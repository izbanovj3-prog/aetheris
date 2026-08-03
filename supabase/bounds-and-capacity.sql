-- ─────────────────────────────────────────────────────────────
-- AETHERIS · coordinate bounds + the participant-cap race
-- Run once in the Supabase SQL editor, after community-2.sql and
-- rate-limit-concurrency.sql. Safe to re-run.
--
-- Two gaps the audit left open, both server-side.
-- ─────────────────────────────────────────────────────────────


-- ═════════════════════════════════════════════════════════════
-- 1 · Coordinates have to be somewhere the platform covers
-- ═════════════════════════════════════════════════════════════
--
-- reports.lat/lon were only checked against -90..90 / -180..180, which
-- is a check that a number is a coordinate, not that it is a coordinate
-- this platform has anything to say about. A report could be filed from
-- the middle of the Pacific and stored happily, where it would sit in the
-- feed and in the per-city aggregate attached to whatever city label the
-- client sent.
--
-- The box below is Kazakhstan's extent with roughly a degree of padding
-- on every side (real extent is lat 40.57–55.45, lon 46.49–87.31). Padded
-- deliberately: a report from just across a border about a plume blowing
-- into the country is a real case, and being generous costs nothing that
-- matters. What it stops is a coordinate that cannot be a genuine
-- observation for this network at all.
--
-- If the platform ever covers another country, this is the one place to
-- widen — and it is a CHECK rather than a trigger so that it is visible
-- in \d and impossible to miss.
--
-- Existing rows: none are outside the box today, but the constraint is
-- added NOT VALID first and validated separately so that if that ever
-- stops being true the migration reports it instead of failing halfway.

alter table public.reports drop constraint if exists reports_within_coverage;
alter table public.reports
  add constraint reports_within_coverage
  check (
    lat is null or lon is null or
    (lat between 39.5 and 56.5 and lon between 45.0 and 88.5)
  ) not valid;

alter table public.reports validate constraint reports_within_coverage;

-- Events carry coordinates for the check-in geo-fence, so the same floor
-- applies: an event pinned outside the coverage area can never be
-- checked into by anyone the platform serves.
alter table public.events drop constraint if exists events_within_coverage;
alter table public.events
  add constraint events_within_coverage
  check (lat between 39.5 and 56.5 and lon between 45.0 and 88.5)
  not valid;

alter table public.events validate constraint events_within_coverage;


-- ═════════════════════════════════════════════════════════════
-- 2 · The participant cap, enforced rather than advised
-- ═════════════════════════════════════════════════════════════
--
-- setRsvp() in lib/events.ts read the count and compared it to the cap
-- before writing — a check in the client, against a number fetched
-- earlier, with nothing stopping two people taking the last place at the
-- same moment. It was documented as a known limitation rather than
-- fixed. This closes it in the only place it can actually be closed.
--
-- Same shape as the rate-limit fix: an advisory lock keyed on the event,
-- taken BEFORE the count, released when the transaction ends. Under READ
-- COMMITTED the waiting transaction's count then runs after the first has
-- committed and sees its row. Contention is per-event, so RSVPs to
-- different events never wait on each other.
--
-- capacity IS NULL means no cap, and is left alone.

create or replace function public.enforce_event_capacity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  cap   integer;
  taken integer;
begin
  select capacity into cap from public.events where id = new.event_id;
  if cap is null then
    return new; -- uncapped event, or unknown id: the FK will reject the latter
  end if;

  perform pg_advisory_xact_lock(4272, hashtext(new.event_id::text));

  select count(*) into taken
    from public.event_rsvps
   where event_id = new.event_id;

  -- The person re-confirming a place they already hold is not taking a
  -- second one; the primary key would collapse it anyway.
  if exists (
    select 1 from public.event_rsvps
     where event_id = new.event_id and anon_id = new.anon_id
  ) then
    return new;
  end if;

  if taken >= cap then
    raise exception 'event_full: % of % places already taken', taken, cap
      using errcode = 'P0001';
  end if;

  return new;
end;
$$;

drop trigger if exists event_rsvps_capacity on public.event_rsvps;
create trigger event_rsvps_capacity
  before insert on public.event_rsvps
  for each row execute function public.enforce_event_capacity();
