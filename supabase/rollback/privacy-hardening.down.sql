-- ─────────────────────────────────────────────────────────────
-- ROLLBACK for supabase/privacy-hardening.sql
--
-- Use only if the hardening breaks production and the front-end cannot be
-- fixed forward quickly. It restores the PRE-hardening access model —
-- including the holes that file closed (public anon_id, open RSVP delete).
--
-- It CANNOT restore precise coordinates: privacy-hardening.sql rounded
-- report positions and erased check-in positions. Only the backup taken
-- before the migration has them (README → "Rollback").
--
-- Before running: redeploy the previous front-end, or keep the current
-- one — it works against both schemas.
-- ─────────────────────────────────────────────────────────────

-- Triggers and functions added by the hardening.
drop trigger if exists reports_privacy on public.reports;
drop function if exists public.reports_before_insert_privacy();
drop function if exists public.delete_my_report(uuid, text);
drop function if exists public.community_city_signals(integer);
drop function if exists public.rsvp_event(uuid, text);
drop function if exists public.withdraw_rsvp(uuid, text);
drop function if exists public.check_in_event(uuid, text, double precision, double precision);
drop function if exists public.event_attendance();
drop function if exists public.my_event_state(text);

-- Rate limiters without the network part (bodies as in rate-limit-concurrency.sql).
create or replace function public.enforce_report_rate_limit()
returns trigger language plpgsql security definer set search_path = public as $$
declare hourly integer; daily integer;
begin
  perform pg_advisory_xact_lock(4271, hashtext(new.anon_id));
  select count(*) into hourly from public.reports
   where anon_id = new.anon_id and created_at > now() - interval '1 hour';
  if hourly >= 5 then
    raise exception 'rate_limit_hourly: % reports already filed in the last hour', hourly using errcode = 'P0001';
  end if;
  select count(*) into daily from public.reports
   where anon_id = new.anon_id and created_at > now() - interval '24 hours';
  if daily >= 20 then
    raise exception 'rate_limit_daily: % reports already filed in the last 24 hours', daily using errcode = 'P0001';
  end if;
  return new;
end; $$;

create or replace function public.enforce_event_rate_limit()
returns trigger language plpgsql security definer set search_path = public as $$
declare daily integer;
begin
  perform pg_advisory_xact_lock(4271, hashtext(new.anon_id));
  select count(*) into daily from public.events
   where anon_id = new.anon_id and created_at > now() - interval '24 hours';
  if daily >= 3 then
    raise exception 'rate_limit_events: % events already created in the last 24 hours', daily using errcode = 'P0001';
  end if;
  if new.starts_at < now() - interval '1 hour' then
    raise exception 'event_in_past: an event cannot start in the past' using errcode = 'P0001';
  end if;
  return new;
end; $$;

-- Check-in fence that keeps coordinates again (columns stay nullable:
-- rows written while hardened have none).
create or replace function public.enforce_checkin_fence()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  ev public.events%rowtype; dist_m double precision;
  radius_m constant double precision := 500; r constant double precision := 6371000;
  dlat double precision; dlon double precision; a double precision;
begin
  select * into ev from public.events where id = new.event_id;
  if not found then raise exception 'checkin_no_event: unknown event' using errcode = 'P0001'; end if;
  if ev.cancelled then raise exception 'checkin_cancelled: this event was cancelled' using errcode = 'P0001'; end if;
  dlat := radians(new.lat - ev.lat); dlon := radians(new.lon - ev.lon);
  a := sin(dlat / 2) ^ 2 + cos(radians(ev.lat)) * cos(radians(new.lat)) * sin(dlon / 2) ^ 2;
  dist_m := r * 2 * atan2(sqrt(a), sqrt(1 - a));
  if dist_m > radius_m then
    raise exception 'checkin_too_far: % m from the event, limit % m', round(dist_m), radius_m using errcode = 'P0001';
  end if;
  if now() < ev.starts_at - interval '1 hour' then
    raise exception 'checkin_too_early: check-in opens an hour before the start' using errcode = 'P0001';
  end if;
  if now() > ev.starts_at + interval '4 hours' then
    raise exception 'checkin_closed: check-in closed four hours after the start' using errcode = 'P0001';
  end if;
  new.distance_m := round(dist_m);
  return new;
end; $$;

-- Table grants back to the Supabase default.
grant select, insert, update, delete, truncate, references, trigger
  on public.reports, public.events, public.event_rsvps, public.event_checkins
  to anon, authenticated;

drop policy if exists "an rsvp may be withdrawn" on public.event_rsvps;
create policy "an rsvp may be withdrawn"
  on public.event_rsvps for delete to anon, authenticated using (true);

-- Private schema and everything in it (salts and hashes are disposable).
drop schema if exists private cascade;

do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.unschedule(jobid) from cron.job where jobname = 'aetheris-network-retention';
  end if;
end;
$$;

notify pgrst, 'reload schema';
