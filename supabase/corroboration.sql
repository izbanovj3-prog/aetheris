-- ─────────────────────────────────────────────────────────────
-- AETHERIS · automatic corroboration for field reports
-- Run once in the Supabase SQL editor, after reports.sql.
--
-- The rule, in one sentence: when two or more DIFFERENT devices report
-- the same category in the same city within 72 hours, every pending
-- report in that group moves from 'pending' to 'cross-checking'.
--
-- What that means, and what it does not:
--   • It means independent people described the same kind of problem in
--     the same place at roughly the same time.
--   • It does NOT mean the reports are accurate, or that any instrument
--     confirmed them. Nothing here is verified. Two people can be wrong
--     together, and one person can be right alone.
--   • Nothing is ever auto-promoted to 'verified'. That status stays
--     reserved for a check this system cannot yet perform.
--
-- Kept as a plain SQL rule rather than anything cleverer so it can be
-- read, argued with, and audited in full by anyone looking at it.
-- ─────────────────────────────────────────────────────────────

create index if not exists reports_city_category_recent_idx
  on public.reports (city, category, created_at desc);

create or replace function public.corroborate_reports()
returns trigger
language plpgsql
-- security definer: anon has no UPDATE policy, and must not get one.
-- The promotion is performed by this rule, never by a client.
security definer
set search_path = public
as $$
declare
  reporters integer;
begin
  -- Count DISTINCT devices, not rows: one person filing five reports is
  -- one account of events, not five corroborating ones.
  select count(distinct anon_id) into reporters
    from public.reports
   where city = new.city
     and category = new.category
     and created_at > now() - interval '72 hours';

  if reporters >= 2 then
    update public.reports
       set status = 'cross-checking'
     where city = new.city
       and category = new.category
       and created_at > now() - interval '72 hours'
       and status = 'pending';
  end if;

  return null; -- AFTER trigger: the row is already stored
end;
$$;

drop trigger if exists reports_corroborate on public.reports;
create trigger reports_corroborate
  after insert on public.reports
  for each row execute function public.corroborate_reports();
