-- ─────────────────────────────────────────────────────────────
-- AETHERIS · community field reports
-- Run this once in the Supabase SQL editor:
--   Dashboard → SQL Editor → New query → paste → Run
--
-- MVP scope, stated plainly: anonymous writes, no auth, no moderation
-- queue. Every row is public on read. The anon_id is a random client-side
-- identifier so a device can recognise its own submissions — it is not an
-- account and proves nothing about who wrote a report.
-- ─────────────────────────────────────────────────────────────

create table if not exists public.reports (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),

  -- anonymous device identifier (localStorage), not an account
  anon_id     text not null check (char_length(anon_id) between 8 and 64),
  author      text not null default 'Anonymous'
              check (char_length(author) <= 40),

  -- location: free-text city label plus optional coordinates
  city        text not null check (char_length(city) between 1 and 80),
  lat         double precision check (lat between -90 and 90),
  lon         double precision check (lon between -180 and 180),

  category    text not null
              check (category in ('air','water','waste','biodiversity','industrial')),
  severity    text not null
              check (severity in ('low','moderate','high','critical')),

  title       text not null check (char_length(title) between 3 and 120),
  body        text not null check (char_length(body) between 3 and 2000),

  -- no moderation pipeline exists yet: everything lands as 'pending'
  status      text not null default 'pending'
              check (status in ('pending','cross-checking','verified')),
  upvotes     integer not null default 0 check (upvotes >= 0)
);

create index if not exists reports_created_at_idx on public.reports (created_at desc);

alter table public.reports enable row level security;

-- Read: the feed is public by design.
drop policy if exists "reports are publicly readable" on public.reports;
create policy "reports are publicly readable"
  on public.reports for select
  to anon, authenticated
  using (true);

-- Write: anonymous inserts allowed. Status is forced to 'pending' so a
-- client cannot publish something pre-marked "verified"; the column
-- checks above cap length and constrain the enums.
drop policy if exists "anyone may file a report" on public.reports;
create policy "anyone may file a report"
  on public.reports for insert
  to anon, authenticated
  with check (status = 'pending' and upvotes = 0);

-- Deliberately absent: update and delete policies. With RLS on and no
-- policy, both are denied for anon — reports cannot be edited or removed
-- from the client, including by whoever wrote them.
