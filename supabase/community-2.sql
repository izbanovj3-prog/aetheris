-- ─────────────────────────────────────────────────────────────
-- AETHERIS · Community 2.0 schema
-- Run once in the Supabase SQL editor, AFTER reports.sql,
-- rate-limit.sql and corroboration.sql.
--
-- This migration does three things:
--   1. Replaces the report status vocabulary with the five statuses
--      from the Community 2.0 concept.
--   2. Adds the columns those statuses and the Eco-Points rules need.
--   3. Adds real events, RSVPs and geo-fenced check-ins.
--
-- The client is written to work with or without this file applied: an
-- unmigrated database keeps accepting reports on the old vocabulary and
-- the app maps the legacy values on read. Nothing here is required for
-- the site to stay up — it is required for the new statuses and the
-- events module to store anything.
-- ─────────────────────────────────────────────────────────────


-- ═════════════════════════════════════════════════════════════
-- 1 · Status vocabulary
-- ═════════════════════════════════════════════════════════════
--
-- The five statuses, in the order a report can travel through them:
--
--   submitted     ① Отправлен — the default, and all a submission ever
--                   claims about itself.
--   ai-context    ② AI-контекст добавлен — comparable data was attached.
--                   Never stored: the context is derived live from the
--                   same Open-Meteo / GBIF feeds the city pages use, so
--                   no client can write the platform's own framing into
--                   the database. See lib/aiContext.ts.
--   corroborated  ③ Corroborated сообществом — the existing 72-hour /
--                   two-device rule from corroboration.sql, unchanged.
--   forwarded     ④ Передано в акимат/эко-инспекцию — a record that data
--                   was handed on, not an assessment of whether it is
--                   true. Operator-only; see section 3.
--   org-response  ⑤ Ответ организации — an organisation left an official
--                   comment. Operator-only, and only ever for an
--                   organisation that has agreed to appear here.
--
-- Deliberately absent, and this is the point of the redesign rather than
-- an omission: there is no "verified" and no "resolved". Aetheris has no
-- moderators, no instrument check behind a field report, and no legal
-- responsibility for verification, so it must not print a word that
-- claims any of the three. "Corroborated" says independent devices
-- described the same thing; "forwarded" says data moved. Neither says
-- the report is true.
--
-- If an accredited partner ever does issue findings, that gets its own
-- status naming the body that issued it — not a quiet promotion of these.

alter table public.reports drop constraint if exists reports_status_check;

-- Legacy rows. 'verified' maps to 'submitted', not to 'corroborated':
-- nothing in the old system ever set it (inserts were forced to
-- 'pending' and the trigger only ever wrote 'cross-checking'), so any
-- row holding it carries no corroboration evidence and must not be
-- upgraded into a claim.
update public.reports set status = 'submitted'    where status in ('pending', 'verified');
update public.reports set status = 'corroborated' where status = 'cross-checking';

alter table public.reports
  add constraint reports_status_check
  check (status in ('submitted', 'ai-context', 'corroborated', 'forwarded', 'org-response'));

alter table public.reports alter column status set default 'submitted';

-- The insert policy pins the status a client may write. Same guarantee as
-- before, new vocabulary: nobody can file something pre-marked as
-- corroborated or forwarded.
drop policy if exists "anyone may file a report" on public.reports;
create policy "anyone may file a report"
  on public.reports for insert
  to anon, authenticated
  with check (status = 'submitted' and upvotes = 0);


-- ═════════════════════════════════════════════════════════════
-- 2 · New report columns
-- ═════════════════════════════════════════════════════════════

alter table public.reports
  -- ④ Передано. Written only by mark_report_forwarded() below.
  add column if not exists forwarded_at   timestamptz,
  add column if not exists forwarded_to   text check (char_length(forwarded_to) <= 160),

  -- ⑤ Ответ организации. Written only by record_org_response() below.
  add column if not exists org_response     text check (char_length(org_response) <= 2000),
  add column if not exists org_response_org text check (char_length(org_response_org) <= 120),
  add column if not exists org_response_at  timestamptz,

  -- Follow-up update on one's own earlier report ("after" photo). Drives
  -- the +15 Eco-Points bonus.
  add column if not exists parent_id uuid references public.reports (id) on delete set null,

  -- Passed the client-side EXIF/sharpness check. Drives the +5 bonus.
  -- Self-declared, like everything else a client writes here; it only
  -- ever affects that device's own point total, which is cosmetic.
  add column if not exists photo_quality boolean not null default false;

create index if not exists reports_parent_idx on public.reports (parent_id)
  where parent_id is not null;

-- Corroboration, re-pointed at the new vocabulary. The rule itself is
-- untouched: 2+ distinct devices, same city, same category, 72 hours.
-- Only reports still sitting at ① are moved, so a forwarded report or one
-- carrying an organisation's response is never walked backwards.
create or replace function public.corroborate_reports()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  reporters integer;
begin
  select count(distinct anon_id) into reporters
    from public.reports
   where city = new.city
     and category = new.category
     and created_at > now() - interval '72 hours';

  if reporters >= 2 then
    update public.reports
       set status = 'corroborated'
     where city = new.city
       and category = new.category
       and created_at > now() - interval '72 hours'
       and status = 'submitted';
  end if;

  return null;
end;
$$;


-- ═════════════════════════════════════════════════════════════
-- 3 · Statuses ④ and ⑤ — the manual trigger point
-- ═════════════════════════════════════════════════════════════
--
-- There is no akimat integration and no partner intake channel. Both
-- statuses therefore move by hand, and the two functions below are the
-- only way to move them. Execute is revoked from anon and authenticated:
-- a browser cannot call these, so no visitor can mark their own report
-- as forwarded to a government body or invent a reply from one.
--
-- An operator runs them with the service key — see scripts/forward-report.mjs.

-- Who forwarded what, when, and to whom. Kept as its own append-only log
-- rather than only as columns on the report: the record that data was
-- handed to a public body should survive the report being edited or the
-- status moving on.
create table if not exists public.report_forwardings (
  id           uuid primary key default gen_random_uuid(),
  created_at   timestamptz not null default now(),
  report_id    uuid not null references public.reports (id) on delete cascade,
  destination  text not null check (char_length(destination) between 2 and 160),
  actor        text not null check (char_length(actor) between 2 and 120),
  note         text check (char_length(note) <= 1000)
);

create index if not exists report_forwardings_report_idx
  on public.report_forwardings (report_id, created_at desc);

alter table public.report_forwardings enable row level security;

-- Public read: a transfer log nobody can inspect is not accountability.
drop policy if exists "forwarding log is publicly readable" on public.report_forwardings;
create policy "forwarding log is publicly readable"
  on public.report_forwardings for select
  to anon, authenticated
  using (true);

-- No insert/update/delete policy: with RLS on, all three are denied for
-- anon. Rows arrive only through the security-definer function below.

create or replace function public.mark_report_forwarded(
  p_report_id   uuid,
  p_destination text,
  p_actor       text,
  p_note        text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.report_forwardings (report_id, destination, actor, note)
  values (p_report_id, p_destination, p_actor, p_note);

  update public.reports
     set status       = 'forwarded',
         forwarded_at = now(),
         forwarded_to = p_destination
   where id = p_report_id
     -- ⑤ is the later state; forwarding again must not overwrite a reply
     -- that has already come back.
     and status <> 'org-response';
end;
$$;

create or replace function public.record_org_response(
  p_report_id uuid,
  p_org       text,
  p_response  text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.reports
     set status           = 'org-response',
         org_response     = p_response,
         org_response_org = p_org,
         org_response_at  = now()
   where id = p_report_id;
end;
$$;

-- Operator-only. Both functions are security definer, so leaving execute
-- open would hand every anonymous visitor the ability to write these.
revoke execute on function public.mark_report_forwarded(uuid, text, text, text) from public, anon, authenticated;
revoke execute on function public.record_org_response(uuid, text, text)          from public, anon, authenticated;

-- Usage, from the SQL editor or a service-key client:
--   select public.mark_report_forwarded(
--     '00000000-0000-0000-0000-000000000000',
--     'Акимат Алматы · управление экологии',
--     'aetheris-team',
--     'Sent by email 2026-08-01, with photo attached.');
--
--   select public.record_org_response(
--     '00000000-0000-0000-0000-000000000000',
--     'Name of the organisation that actually replied',
--     'Text of their reply, quoted as sent.');
--
-- Do not call record_org_response for an organisation that has not agreed
-- to appear on the platform. Naming a body without its consent is the one
-- mistake this project has already made once.


-- ═════════════════════════════════════════════════════════════
-- 4 · Events, RSVPs and check-ins
-- ═════════════════════════════════════════════════════════════

create table if not exists public.events (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  anon_id     text not null check (char_length(anon_id) between 8 and 64),

  title       text not null check (char_length(title) between 4 and 120),
  description text not null check (char_length(description) between 4 and 1200),
  place       text not null check (char_length(place) between 2 and 120),

  lat         double precision not null check (lat between -90 and 90),
  lon         double precision not null check (lon between -180 and 180),

  starts_at   timestamptz not null,
  -- Null means "no cap". A cap of 1 would be a private appointment, so 2 up.
  capacity    integer check (capacity between 2 and 2000),

  cancelled   boolean not null default false
);

create index if not exists events_starts_at_idx on public.events (starts_at);

create table if not exists public.event_rsvps (
  event_id   uuid not null references public.events (id) on delete cascade,
  anon_id    text not null check (char_length(anon_id) between 8 and 64),
  created_at timestamptz not null default now(),
  primary key (event_id, anon_id)
);

create table if not exists public.event_checkins (
  event_id   uuid not null references public.events (id) on delete cascade,
  anon_id    text not null check (char_length(anon_id) between 8 and 64),
  created_at timestamptz not null default now(),
  lat        double precision not null check (lat between -90 and 90),
  lon        double precision not null check (lon between -180 and 180),
  distance_m integer not null check (distance_m >= 0),
  primary key (event_id, anon_id)
);

alter table public.events         enable row level security;
alter table public.event_rsvps    enable row level security;
alter table public.event_checkins enable row level security;

drop policy if exists "events are publicly readable" on public.events;
create policy "events are publicly readable"
  on public.events for select to anon, authenticated using (true);

drop policy if exists "anyone may create an event" on public.events;
create policy "anyone may create an event"
  on public.events for insert to anon, authenticated
  with check (cancelled = false);

drop policy if exists "rsvps are publicly readable" on public.event_rsvps;
create policy "rsvps are publicly readable"
  on public.event_rsvps for select to anon, authenticated using (true);

drop policy if exists "anyone may rsvp" on public.event_rsvps;
create policy "anyone may rsvp"
  on public.event_rsvps for insert to anon, authenticated with check (true);

-- Known limitation, stated rather than hidden: anon_id is a client-supplied
-- string, so this policy cannot prove the deleter is the person who RSVP'd.
-- Anyone able to read an anon_id can cancel that RSVP. Withdrawing an RSVP
-- is worth more than the abuse is worth here, and no report data is
-- reachable this way — but it is a real hole, and it closes when the
-- platform has accounts. Surfaced on /methodology under Known limitations.
drop policy if exists "an rsvp may be withdrawn" on public.event_rsvps;
create policy "an rsvp may be withdrawn"
  on public.event_rsvps for delete to anon, authenticated using (true);

drop policy if exists "checkins are publicly readable" on public.event_checkins;
create policy "checkins are publicly readable"
  on public.event_checkins for select to anon, authenticated using (true);

drop policy if exists "anyone may check in" on public.event_checkins;
create policy "anyone may check in"
  on public.event_checkins for insert to anon, authenticated with check (true);

-- No update or delete on events or check-ins: an event cannot be rewritten
-- after people have RSVP'd to it, and a check-in cannot be un-made.

-- Cap event creation per device, mirroring the report rate limit.
create or replace function public.enforce_event_rate_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  daily integer;
begin
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

drop trigger if exists events_rate_limit on public.events;
create trigger events_rate_limit
  before insert on public.events
  for each row execute function public.enforce_event_rate_limit();

-- Geo-fence + time window, enforced here rather than only in the browser.
-- A check-in is the one thing on the platform that asserts someone was
-- physically somewhere, so the claim is checked where the client cannot
-- reach it: within CHECKIN_RADIUS_M of the event and inside its window.
-- (Coordinates still come from the device and a determined person can lie
-- to their own browser — this stops the accidental and the casual case,
-- not a deliberate forgery. Said plainly on /methodology.)
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
  r        constant double precision := 6371000; -- mean earth radius, metres
  dlat     double precision;
  dlon     double precision;
  a        double precision;
begin
  select * into ev from public.events where id = new.event_id;
  if not found then
    raise exception 'checkin_no_event: unknown event' using errcode = 'P0001';
  end if;
  if ev.cancelled then
    raise exception 'checkin_cancelled: this event was cancelled' using errcode = 'P0001';
  end if;

  -- Haversine.
  dlat := radians(new.lat - ev.lat);
  dlon := radians(new.lon - ev.lon);
  a := sin(dlat / 2) ^ 2
     + cos(radians(ev.lat)) * cos(radians(new.lat)) * sin(dlon / 2) ^ 2;
  dist_m := r * 2 * atan2(sqrt(a), sqrt(1 - a));

  if dist_m > radius_m then
    raise exception 'checkin_too_far: % m from the event, limit % m',
      round(dist_m), radius_m using errcode = 'P0001';
  end if;

  -- Open from an hour before the start until four hours after it.
  if now() < ev.starts_at - interval '1 hour' then
    raise exception 'checkin_too_early: check-in opens an hour before the start'
      using errcode = 'P0001';
  end if;
  if now() > ev.starts_at + interval '4 hours' then
    raise exception 'checkin_closed: check-in closed four hours after the start'
      using errcode = 'P0001';
  end if;

  new.distance_m := round(dist_m);
  return new;
end;
$$;

drop trigger if exists event_checkin_fence on public.event_checkins;
create trigger event_checkin_fence
  before insert on public.event_checkins
  for each row execute function public.enforce_checkin_fence();
