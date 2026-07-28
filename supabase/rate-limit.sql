-- ─────────────────────────────────────────────────────────────
-- AETHERIS · rate limit for community field reports
-- Run once in the Supabase SQL editor, after reports.sql.
--
-- Caps submissions per anonymous device id: 5 per hour, 20 per day.
-- Chosen to be invisible to a real person — filing five reports in an
-- hour already means walking between sites — while stopping a bot from
-- flooding the feed.
--
-- Implemented as a BEFORE INSERT trigger rather than tightened RLS on
-- purpose. A failed RLS `with check` comes back as 42501, the same code
-- as every other permission failure, so the client cannot tell "you have
-- hit the limit" apart from "the datastore rejected you" and would fall
-- back to local-only storage while telling the user it saved. The
-- trigger raises P0001 with a parseable message instead.
--
-- Out of scope, deliberately: no moderation queue, no admin review, no
-- promotion to verified.
-- ─────────────────────────────────────────────────────────────

-- Counting recent rows per device is the hot path for every insert.
create index if not exists reports_anon_recent_idx
  on public.reports (anon_id, created_at desc);

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

drop trigger if exists reports_rate_limit on public.reports;
create trigger reports_rate_limit
  before insert on public.reports
  for each row execute function public.enforce_report_rate_limit();
