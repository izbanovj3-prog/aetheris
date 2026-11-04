-- ─────────────────────────────────────────────────────────────
-- AETHERIS · privacy and abuse hardening before public launch
-- Run once in the Supabase SQL editor, AFTER bounds-and-capacity.sql.
-- Safe to re-run.
--
-- DEPLOY ORDER: ship the front-end that reads explicit columns and calls
-- the functions below FIRST, then run this file. The earlier front-end
-- reads `select=*` and anon_id, both of which this file closes; the new
-- one works against the database both before and after this file.
--
-- IRREVERSIBLE PARTS — take a backup first (README → "Rollback"):
--   • existing report coordinates are rounded to ~1 km;
--   • existing check-in coordinates are erased.
--
-- What changes, and why:
--
-- 1. Exact positions are not stored. Report coordinates are rounded to two
--    decimals on insert (~1.1 km north–south, ~0.7–0.8 km east–west across
--    Kazakhstan). Check-in coordinates are used once to compute the
--    distance to the event and then discarded.
-- 2. anon_id is no longer publicly readable. Anyone could read it, link
--    every report from one device, and act as that device. Visitors now
--    get an explicit column list without it; attendance is served as
--    counts.
-- 3. Clients can write only the columns a submission needs. status,
--    upvotes, author and the forwarding / response columns are not
--    insertable at all, rather than guarded only by the insert policy.
-- 4. RSVP withdrawal has no public DELETE policy any more. The old one let
--    any visitor delete every RSVP on any event with one request.
-- 5. A device can delete its own report (privacy policy: right to erase).
-- 6. A second rate limit keyed on a salted hash of the client IP, because
--    the device limit is keyed on an id the client chooses. The salt is
--    random, new every UTC day, and deleted when the day ends; hashes are
--    deleted after 24 hours. No raw IP is stored anywhere.
--
-- Device ids as credentials. Every anon_id written before this file was
-- public, so an old id proves nothing about who holds it. The functions
-- that act on behalf of a device (delete, withdraw, "my state", RSVP,
-- check-in) accept only ids in the new format 'v2-<uuid>', which the new
-- front-end generates and which has never been readable by anyone.
-- ─────────────────────────────────────────────────────────────


-- ═════════════════════════════════════════════════════════════
-- 0 · Private schema — PostgREST does not expose it
-- ═════════════════════════════════════════════════════════════

create schema if not exists private;
revoke all on schema private from public;
revoke all on schema private from anon, authenticated;

create table if not exists private.daily_salt (
  day  date primary key,
  salt text not null
);

create table if not exists private.network_hits (
  ip_hash    text        not null,
  kind       text        not null check (kind in ('report', 'event', 'attend')),
  created_at timestamptz not null default now()
);
-- 'attend' (RSVPs and check-ins) was added after this table first shipped;
-- rebuild the check so re-running the file brings an existing table along.
alter table private.network_hits drop constraint if exists network_hits_kind_check;
alter table private.network_hits
  add constraint network_hits_kind_check check (kind in ('report', 'event', 'attend'));
create index if not exists network_hits_lookup_idx
  on private.network_hits (ip_hash, kind, created_at desc);

/* v2 ids that were nevertheless public. The front-end is deployed before
   this file (see README), and until this file runs anon_id is readable by
   anyone, so every v2 id written in that window was published. Those ids
   are recorded here and never prove ownership. The burn below runs only
   while anon can still read anon_id — i.e. before hardening, or again after
   the rollback re-opened it — so re-running this file on a hardened
   database burns nothing. */
create table if not exists private.burned_device_ids (
  anon_id    text        primary key,
  burned_at  timestamptz not null default now()
);

do $$
begin
  if has_column_privilege('anon', 'public.reports', 'anon_id', 'SELECT') then
    insert into private.burned_device_ids (anon_id)
    select anon_id from public.reports        where anon_id is not null
    union
    select anon_id from public.events         where anon_id is not null
    union
    select anon_id from public.event_rsvps    where anon_id is not null
    union
    select anon_id from public.event_checkins where anon_id is not null
    on conflict (anon_id) do nothing;
  end if;
end;
$$;

/** True for a device id that has never been publicly readable. */
create or replace function private.is_private_device_id(p text)
returns boolean
language sql
stable
as $$
  select coalesce(
    p ~ '^v2-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$',
    false)
    and not exists (select 1 from private.burned_device_ids b where b.anon_id = p)
$$;

/**
 * Salted hash of the requesting client's IP, or null when the request
 * carries none (SQL editor, service scripts).
 *
 * cf-connecting-ip is preferred: it is set by the edge in front of the
 * Supabase API. x-forwarded-for is the documented fallback, but its first
 * entry can be supplied by the client, so a determined sender may be able
 * to rotate it. tests/security.rls.test.ts probes this on the test project.
 *
 * Also does the housekeeping — drops salts from earlier days and hashes
 * older than 24 hours — so retention does not depend on pg_cron.
 */
create or replace function private.client_ip_hash()
returns text
language plpgsql
volatile
security definer
set search_path = private, public
as $$
declare
  v_headers json;
  v_ip      text;
  v_salt    text;
  v_today   date := (now() at time zone 'utc')::date;
begin
  begin
    v_headers := nullif(current_setting('request.headers', true), '')::json;
  exception when others then
    v_headers := null;
  end;
  if v_headers is null then
    return null;
  end if;

  v_ip := coalesce(
    nullif(trim(v_headers->>'cf-connecting-ip'), ''),
    nullif(trim(split_part(coalesce(v_headers->>'x-forwarded-for', ''), ',', 1)), '')
  );
  if v_ip is null then
    return null;
  end if;

  delete from private.daily_salt   where day < v_today;
  delete from private.network_hits where created_at < now() - interval '24 hours';

  insert into private.daily_salt (day, salt)
  values (v_today, replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''))
  on conflict (day) do nothing;

  select salt into v_salt from private.daily_salt where day = v_today;

  return encode(sha256(convert_to(v_salt || '|' || v_ip, 'UTF8')), 'hex');
end;
$$;

/**
 * Network-level limit, shared by reports and events. Raises with a message
 * that contains the same tag the device limit uses, so existing client
 * code already maps it to "rate limited". Records the hit on success.
 */
create or replace function private.enforce_network_limit(
  p_kind       text,
  p_hourly_cap integer,
  p_daily_cap  integer,
  p_tag_hourly text,
  p_tag_daily  text
)
returns void
language plpgsql
security definer
set search_path = private, public
as $$
declare
  v_hash   text := private.client_ip_hash();
  v_hourly integer;
  v_daily  integer;
begin
  if v_hash is null then
    return;
  end if;

  perform pg_advisory_xact_lock(4273, hashtext(v_hash));

  select count(*) filter (where h.created_at > now() - interval '1 hour'),
         count(*)
    into v_hourly, v_daily
    from private.network_hits h
   where h.ip_hash = v_hash
     and h.kind = p_kind
     and h.created_at > now() - interval '24 hours';

  if p_hourly_cap is not null and v_hourly >= p_hourly_cap then
    raise exception '%_network: limit for this network reached', p_tag_hourly
      using errcode = 'P0001';
  end if;
  if v_daily >= p_daily_cap then
    raise exception '%_network: limit for this network reached', p_tag_daily
      using errcode = 'P0001';
  end if;

  insert into private.network_hits (ip_hash, kind) values (v_hash, p_kind);
end;
$$;

revoke all on all tables    in schema private from public, anon, authenticated;
revoke all on all functions in schema private from public, anon, authenticated;

-- Retention safety net where pg_cron exists (Supabase: enable it under
-- Database → Extensions). Without it, cleanup still runs on every insert.
do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.unschedule(jobid) from cron.job where jobname = 'aetheris-network-retention';
    perform cron.schedule(
      'aetheris-network-retention',
      '17 * * * *',
      $job$
        delete from private.network_hits where created_at < now() - interval '24 hours';
        delete from private.daily_salt where day < (now() at time zone 'utc')::date;
      $job$
    );
  end if;
end;
$$;


-- ═════════════════════════════════════════════════════════════
-- 1 · Reports
-- ═════════════════════════════════════════════════════════════

create or replace function public.reports_before_insert_privacy()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- ~1 km. Enforced here, not only in the browser, so nothing finer is kept.
  if new.lat is not null then new.lat := round(new.lat::numeric, 2)::double precision; end if;
  if new.lon is not null then new.lon := round(new.lon::numeric, 2)::double precision; end if;

  -- Not client-writable any more; pinned anyway.
  new.author := 'Anonymous';

  -- A follow-up (+15 points) must follow up the same device's own report.
  if new.parent_id is not null and not exists (
    select 1 from public.reports p
     where p.id = new.parent_id and p.anon_id = new.anon_id
  ) then
    raise exception 'parent_not_yours: a follow-up must refer to your own report'
      using errcode = 'P0001';
  end if;

  return new;
end;
$$;

drop trigger if exists reports_privacy on public.reports;
create trigger reports_privacy
  before insert on public.reports
  for each row execute function public.reports_before_insert_privacy();

-- Existing rows. Irreversible by design: the point is not to keep them.
update public.reports
   set lat = round(lat::numeric, 2)::double precision,
       lon = round(lon::numeric, 2)::double precision
 where (lat is not null and lat <> round(lat::numeric, 2)::double precision)
    or (lon is not null and lon <> round(lon::numeric, 2)::double precision);

-- Device limit unchanged (5/hour, 20/day). Network limit added, generous
-- on purpose: mobile carriers put many people behind one address.
create or replace function public.enforce_report_rate_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  hourly integer;
  daily  integer;
begin
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

  perform private.enforce_network_limit('report', 30, 100, 'rate_limit_hourly', 'rate_limit_daily');

  return new;
end;
$$;

-- Read: every column except anon_id. Write: only what a submission needs.
revoke select, insert, update, delete, truncate, references, trigger
  on public.reports from anon, authenticated;
grant select (id, created_at, author, city, lat, lon, category, severity, title, body,
              status, upvotes, forwarded_at, forwarded_to, org_response,
              org_response_org, org_response_at, parent_id, photo_quality)
  on public.reports to anon, authenticated;
grant insert (anon_id, city, lat, lon, category, severity, title, body,
              parent_id, photo_quality)
  on public.reports to anon, authenticated;

/**
 * Delete one's own report. Returns true when a row was removed.
 *
 * Not for a report already at ④ or ⑤: deleting it would cascade away the
 * record that data was handed to a public body. Those are removed by the
 * team on request (contact address in the privacy policy).
 */
create or replace function public.delete_my_report(p_report_id uuid, p_anon_id text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_city     text;
  v_category text;
  reporters  integer;
begin
  if not private.is_private_device_id(p_anon_id) then
    return false;
  end if;
  delete from public.reports
   where id = p_report_id
     and anon_id = p_anon_id
     and status not in ('forwarded', 'org-response')
  returning city, category into v_city, v_category;
  if not found then
    return false;
  end if;

  -- ③ rests on two devices. If this report was one of them, the others in
  -- its group go back to ①; ④/⑤ are never walked backwards.
  select count(distinct anon_id) into reporters
    from public.reports
   where city = v_city
     and category = v_category
     and created_at > now() - interval '72 hours';
  if reporters < 2 then
    update public.reports
       set status = 'submitted'
     where city = v_city
       and category = v_category
       and created_at > now() - interval '72 hours'
       and status = 'corroborated';
  end if;
  return true;
end;
$$;

/**
 * Per-city community signal for the map and city pages: counts, never
 * device ids. city_reporters counts distinct devices in that city.
 */
create or replace function public.community_city_signals(p_days integer default 30)
returns table (
  city           text,
  category       text,
  severity       text,
  reports        integer,
  latest         timestamptz,
  city_reporters integer
)
language sql
stable
security definer
set search_path = public
as $$
  with recent as (
    select r.city, r.category, r.severity, r.anon_id, r.created_at
      from public.reports r
     where r.created_at > now() - make_interval(days => least(greatest(coalesce(p_days, 30), 1), 90))
  ),
  per_city as (
    select recent.city, count(distinct recent.anon_id)::integer as n
      from recent group by recent.city
  )
  select g.city, g.category, g.severity, count(*)::integer, max(g.created_at), pc.n
    from recent g join per_city pc on pc.city = g.city
   group by g.city, g.category, g.severity, pc.n
$$;


-- ═════════════════════════════════════════════════════════════
-- 2 · Events
-- ═════════════════════════════════════════════════════════════

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

  perform private.enforce_network_limit('event', null, 10, 'rate_limit_events', 'rate_limit_events');

  return new;
end;
$$;

revoke select, insert, update, delete, truncate, references, trigger
  on public.events from anon, authenticated;
grant select (id, created_at, title, description, place, lat, lon, starts_at, capacity, cancelled)
  on public.events to anon, authenticated;
grant insert (anon_id, title, description, place, lat, lon, starts_at, capacity)
  on public.events to anon, authenticated;


-- ═════════════════════════════════════════════════════════════
-- 3 · RSVPs and check-ins — functions only
-- ═════════════════════════════════════════════════════════════

drop policy if exists "an rsvp may be withdrawn" on public.event_rsvps;
revoke select, insert, update, delete, truncate, references, trigger
  on public.event_rsvps from anon, authenticated;
revoke select, insert, update, delete, truncate, references, trigger
  on public.event_checkins from anon, authenticated;

-- Check-ins keep the computed distance only.
alter table public.event_checkins alter column lat drop not null;
alter table public.event_checkins alter column lon drop not null;
update public.event_checkins set lat = null, lon = null where lat is not null or lon is not null;

create or replace function public.enforce_checkin_fence()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  ev       public.events%rowtype;
  dist_m   double precision;
  radius_m constant double precision := 500;
  r        constant double precision := 6371000;
  dlat     double precision;
  dlon     double precision;
  a        double precision;
begin
  if new.lat is null or new.lon is null then
    raise exception 'checkin_no_position: a position is required to check in'
      using errcode = 'P0001';
  end if;

  select * into ev from public.events where id = new.event_id;
  if not found then
    raise exception 'checkin_no_event: unknown event' using errcode = 'P0001';
  end if;
  if ev.cancelled then
    raise exception 'checkin_cancelled: this event was cancelled' using errcode = 'P0001';
  end if;

  dlat := radians(new.lat - ev.lat);
  dlon := radians(new.lon - ev.lon);
  a := sin(dlat / 2) ^ 2
     + cos(radians(ev.lat)) * cos(radians(new.lat)) * sin(dlon / 2) ^ 2;
  dist_m := r * 2 * atan2(sqrt(a), sqrt(1 - a));

  if dist_m > radius_m then
    raise exception 'checkin_too_far: % m from the event, limit % m',
      round(dist_m), radius_m using errcode = 'P0001';
  end if;
  if now() < ev.starts_at - interval '1 hour' then
    raise exception 'checkin_too_early: check-in opens an hour before the start'
      using errcode = 'P0001';
  end if;
  if now() > ev.starts_at + interval '4 hours' then
    raise exception 'checkin_closed: check-in closed four hours after the start'
      using errcode = 'P0001';
  end if;

  new.distance_m := round(dist_m);
  -- The position has done its job; it is not kept.
  new.lat := null;
  new.lon := null;
  return new;
end;
$$;

create or replace function public.rsvp_event(p_event_id uuid, p_anon_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not private.is_private_device_id(p_anon_id) then
    raise exception 'device_id_invalid: reload the page and try again' using errcode = 'P0001';
  end if;
  -- Only upcoming, not cancelled events take RSVPs; and one network cannot
  -- fill an event's places by rotating device ids.
  if exists (select 1 from public.events e where e.id = p_event_id and e.cancelled) then
    raise exception 'checkin_cancelled: this event was cancelled' using errcode = 'P0001';
  end if;
  if not exists (select 1 from public.events e where e.id = p_event_id and e.starts_at > now()) then
    raise exception 'event_in_past: this event has already started or does not exist' using errcode = 'P0001';
  end if;
  perform private.enforce_network_limit('attend', 60, 300, 'rate_limit_events', 'rate_limit_events');
  insert into public.event_rsvps (event_id, anon_id)
  values (p_event_id, p_anon_id)
  on conflict (event_id, anon_id) do nothing;
end;
$$;

create or replace function public.withdraw_rsvp(p_event_id uuid, p_anon_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not private.is_private_device_id(p_anon_id) then
    return;
  end if;
  delete from public.event_rsvps where event_id = p_event_id and anon_id = p_anon_id;
end;
$$;

create or replace function public.check_in_event(
  p_event_id uuid, p_anon_id text, p_lat double precision, p_lon double precision
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not private.is_private_device_id(p_anon_id) then
    raise exception 'device_id_invalid: reload the page and try again' using errcode = 'P0001';
  end if;
  -- The geo-fence and time window are the trigger's; this caps how many
  -- check-ins one network can add by rotating device ids.
  perform private.enforce_network_limit('attend', 60, 300, 'rate_limit_events', 'rate_limit_events');
  insert into public.event_checkins (event_id, anon_id, lat, lon, distance_m)
  values (p_event_id, p_anon_id, p_lat, p_lon, 0)
  on conflict (event_id, anon_id) do nothing;
end;
$$;

/** Counts per event — public, and all that the page needs. */
create or replace function public.event_attendance()
returns table (event_id uuid, going integer, checked_in integer)
language sql
stable
security definer
set search_path = public
as $$
  select e.id,
         (select count(*)::integer from public.event_rsvps r where r.event_id = e.id),
         (select count(*)::integer from public.event_checkins c where c.event_id = e.id)
    from public.events e
   where e.starts_at > now() - interval '4 hours'
     and not e.cancelled
$$;

/** Which events this device created, RSVP'd to, or checked into. */
create or replace function public.my_event_state(p_anon_id text)
returns table (event_id uuid, organiser boolean, rsvp boolean, checked_in boolean)
language sql
stable
security definer
set search_path = public
as $$
  select e.id,
         e.anon_id = p_anon_id,
         exists (select 1 from public.event_rsvps r
                  where r.event_id = e.id and r.anon_id = p_anon_id),
         exists (select 1 from public.event_checkins c
                  where c.event_id = e.id and c.anon_id = p_anon_id)
    from public.events e
   where private.is_private_device_id(p_anon_id)
     and e.starts_at > now() - interval '4 hours'
     and (e.anon_id = p_anon_id
          or exists (select 1 from public.event_rsvps r
                      where r.event_id = e.id and r.anon_id = p_anon_id)
          or exists (select 1 from public.event_checkins c
                      where c.event_id = e.id and c.anon_id = p_anon_id))
$$;


-- ═════════════════════════════════════════════════════════════
-- 4 · Who may call what
-- ═════════════════════════════════════════════════════════════
--
-- Supabase grants EXECUTE on new public functions to anon by default.
-- Trigger functions cannot be called directly, but are revoked anyway so
-- the grant list reads as intent.

revoke execute on function public.reports_before_insert_privacy() from public, anon, authenticated;

revoke execute on function public.delete_my_report(uuid, text)                           from public;
revoke execute on function public.community_city_signals(integer)                        from public;
revoke execute on function public.rsvp_event(uuid, text)                                 from public;
revoke execute on function public.withdraw_rsvp(uuid, text)                              from public;
revoke execute on function public.check_in_event(uuid, text, double precision, double precision) from public;
revoke execute on function public.event_attendance()                                     from public;
revoke execute on function public.my_event_state(text)                                   from public;

grant execute on function public.delete_my_report(uuid, text)                           to anon, authenticated;
grant execute on function public.community_city_signals(integer)                        to anon, authenticated;
grant execute on function public.rsvp_event(uuid, text)                                 to anon, authenticated;
grant execute on function public.withdraw_rsvp(uuid, text)                              to anon, authenticated;
grant execute on function public.check_in_event(uuid, text, double precision, double precision) to anon, authenticated;
grant execute on function public.event_attendance()                                     to anon, authenticated;
grant execute on function public.my_event_state(text)                                   to anon, authenticated;

-- The operator functions stay operator-only (re-stated: a re-run of an
-- earlier file must not have reopened them).
revoke execute on function public.mark_report_forwarded(uuid, text, text, text) from public, anon, authenticated;
revoke execute on function public.record_org_response(uuid, text, text)          from public, anon, authenticated;

-- PostgREST caches the schema; tell it the grants and functions changed.
notify pgrst, 'reload schema';
