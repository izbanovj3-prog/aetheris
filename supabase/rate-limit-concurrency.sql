-- ─────────────────────────────────────────────────────────────
-- AETHERIS · close the rate-limiter race
-- Run once in the Supabase SQL editor, after rate-limit.sql and
-- community-2.sql. Safe to re-run: both functions are CREATE OR REPLACE
-- and neither trigger definition changes.
--
-- THE BUG
--
-- Both rate limiters counted and then decided:
--
--     select count(*) into hourly from reports where anon_id = ... ;
--     if hourly >= 5 then raise ... end if;
--
-- Postgres runs on READ COMMITTED by default, and PostgREST does not
-- change that. Under READ COMMITTED a statement sees only rows committed
-- before the statement began, so a row another transaction has inserted
-- but not yet committed is invisible to this count. Two submissions from
-- the same device arriving together therefore both count 4, both conclude
-- there is room, and both insert — six rows in the hour against a limit
-- of five. Nothing errors; the limit is simply exceeded, quietly.
--
-- This is a time-of-check-to-time-of-use race, and it is reachable from a
-- browser: fire the same submission twice in parallel. The window is
-- small, which is exactly why it survived — the sequential happy path
-- that anyone would test by hand always passes.
--
-- THE FIX
--
-- Take a transaction-scoped advisory lock keyed on the device id before
-- counting. pg_advisory_xact_lock blocks until it can be taken and is
-- released automatically when the transaction commits or rolls back, so:
--
--   • Transaction A takes the lock, counts, inserts, commits — releasing
--     the lock and making its row visible.
--   • Transaction B was blocked on the lock. It now proceeds, and because
--     READ COMMITTED takes a FRESH snapshot for each statement, its count
--     runs after A committed and therefore sees A's row.
--
-- The ordering matters and is the whole fix: the lock is acquired BEFORE
-- the count, not after. Acquiring it afterwards would serialise nothing.
--
-- Scope of the contention: the lock key is the device id, so two people
-- filing at the same instant never wait on each other. Only a single
-- device's own concurrent submissions serialise, which is the case that
-- was broken.
--
-- Caveat worth stating: this argument depends on READ COMMITTED. Under
-- REPEATABLE READ or SERIALIZABLE the snapshot is fixed at transaction
-- start, so B's count would still miss A's row even after waiting; that
-- configuration would need the retry-on-40001 pattern instead. Supabase
-- serves PostgREST on READ COMMITTED, so this holds today — but if the
-- isolation level is ever raised, this file is wrong and must change.
--
-- The two-argument lock form namespaces the key (4271 is arbitrary but
-- fixed) so these locks cannot collide with advisory locks taken for any
-- other purpose. hashtext() collisions between two different anon_ids are
-- possible and harmless: the effect is a brief unnecessary wait, never a
-- wrong answer.
-- ─────────────────────────────────────────────────────────────

/** Namespace for every Aetheris per-device advisory lock. */
-- (kept inline rather than as a settings row so the file stands alone)

create or replace function public.enforce_report_rate_limit()
returns trigger
language plpgsql
-- security definer so the count sees every row: the anon role can read
-- the table today, but the limit must not depend on that staying true.
security definer
set search_path = public
as $$
declare
  hourly integer;
  daily  integer;
begin
  -- Serialise this device's concurrent submissions before counting them.
  -- Released at transaction end; see the header for why this closes the
  -- read-committed window rather than merely narrowing it.
  perform pg_advisory_xact_lock(4271, hashtext(new.anon_id));

  select count(*) into hourly
    from public.reports
   where anon_id = new.anon_id
     and created_at > now() - interval '1 hour';

  if hourly >= 5 then
    raise exception 'rate_limit_hourly: % reports already filed in the last hour', hourly
      using errcode = 'P0001';
  end if;

  select count(*) into daily
    from public.reports
   where anon_id = new.anon_id
     and created_at > now() - interval '24 hours';

  if daily >= 20 then
    raise exception 'rate_limit_daily: % reports already filed in the last 24 hours', daily
      using errcode = 'P0001';
  end if;

  return new;
end;
$$;

-- The events limiter had the identical shape and therefore the identical
-- race: three events per device per day, countable past by racing.
create or replace function public.enforce_event_rate_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  daily integer;
begin
  perform pg_advisory_xact_lock(4271, hashtext(new.anon_id));

  select count(*) into daily
    from public.events
   where anon_id = new.anon_id
     and created_at > now() - interval '24 hours';

  if daily >= 3 then
    raise exception 'rate_limit_events: % events already created in the last 24 hours', daily
      using errcode = 'P0001';
  end if;

  if new.starts_at < now() - interval '1 hour' then
    raise exception 'event_in_past: an event cannot start in the past'
      using errcode = 'P0001';
  end if;

  return new;
end;
$$;

-- Triggers are unchanged; re-stated so this file is self-contained if it
-- is ever run against a database where only one of them exists.
drop trigger if exists reports_rate_limit on public.reports;
create trigger reports_rate_limit
  before insert on public.reports
  for each row execute function public.enforce_report_rate_limit();

drop trigger if exists events_rate_limit on public.events;
create trigger events_rate_limit
  before insert on public.events
  for each row execute function public.enforce_event_rate_limit();
