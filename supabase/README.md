# Database migrations

There is no migration runner. These files are applied by hand in the
Supabase SQL editor, and **order matters** — several of them alter objects
the earlier ones create. Apply them top to bottom:

| # | File | What it does |
| --- | --- | --- |
| 1 | `reports.sql` | `reports` table, RLS, public read, anonymous insert |
| 2 | `rate-limit.sql` | per-device submission limit (5/hour, 20/day) |
| 3 | `corroboration.sql` | the 72-hour / two-device corroboration rule |
| 4 | `community-2.sql` | five-status vocabulary, ④/⑤ columns and operator-only functions, forwarding log, events + RSVPs + geo-fenced check-ins |
| 5 | `rate-limit-concurrency.sql` | closes the read-committed race in both rate limiters |
| 6 | `bounds-and-capacity.sql` | coverage-area coordinate bounds; enforces the participant cap |
| 7 | `privacy-hardening.sql` | ~1 km coordinates, anon_id unreadable, column-level write grants, RSVP/check-in/delete through functions, salted-IP network limit |

Every file is idempotent — `create or replace`, `if not exists`,
`drop … if exists` — so re-running one is safe and re-running the whole
sequence on an existing database is a no-op apart from the constraint
rebuilds.

## Applied state

Files 1–5 are applied to the production project. **Files 6 and 7 are not.**
Nothing here tracks that automatically; this line is the record, and it
has to be updated by whoever runs one.

## Applying 6 and 7 to production

Only with the owner's explicit go-ahead, and in this order:

1. **Front-end first.** Deploy the build that reads explicit columns and
   calls the new functions. It works against the database both before and
   after file 7 — the previous front-end does not work after it.
2. **Test project.** Apply 1–7 to the separate test project and run
   `npm run test:security` against it (see the header of
   `tests/security.rls.test.ts`). Green there before production.
3. **Backup.** Dashboard → Database → Backups, or
   `pg_dump --data-only -t public.reports -t public.event_checkins`.
   File 7 rounds stored coordinates and erases check-in positions; that
   part cannot be undone without this backup.
4. **Enable `pg_cron`** (Database → Extensions). Without it the 24-hour
   deletion of network hashes and old salts runs only when someone
   submits, so after a quiet spell they outlive 24 hours — and the privacy
   page promises 24 hours.
5. Run `bounds-and-capacity.sql`, then `privacy-hardening.sql`, in the
   SQL editor — **soon after step 1**. Until file 7 runs, device ids are
   publicly readable and check-ins on the old path store the exact point
   in a public table. File 7 burns every device id it finds that was
   readable when it ran (`private.burned_device_ids`), so ids written in
   that window never prove ownership; their owners get a fresh id on their
   next action, and their earlier rows can only be removed by the team.
6. Update "Applied state" above.
7. **Test project too.** File 7 changed after it was applied to the test
   project (burned ids, RSVP/check-in limits, recount on delete). Re-run
   `privacy-hardening.sql` there — it is idempotent — so the test project
   matches the file.

## Rollback

`rollback/privacy-hardening.down.sql` restores the pre-file-7 access
model (and with it the holes file 7 closed). It cannot bring back precise
coordinates — only the backup from step 3 has them. `tests/schema.test.ts`
checks that the rollback applies, that anon_id is readable again and the
new functions and the private schema are gone, that file 7 can be applied
again afterwards, and that re-applying it burns the device ids the
rollback re-published. It does not check every policy and grant the
rollback restores.

## Checking them without a server

`tests/schema.test.ts` replays every file in the order above against a
brand-new Postgres — PGlite, the real engine compiled to WASM — then
creates `anon`, `authenticated` and `service_role` the way Supabase does
and probes what each can actually reach. It runs in `npm test`, offline,
in about ten seconds.

It is the answer to both "do these apply cleanly from nothing?" and "what
can each role do once they have?". **It cannot test concurrency:** PGlite
is a single connection, so the advisory locks in files 5 and 6 are
exercised for correctness but never for contention. That still needs
`scripts/probe-rate-limit-race.mjs` against a real server.

For syntax alone, without the role setup, `libpg_query` also works:

```bash
npx --yes -p libpg-query node -e "
const {parse,loadModule}=require('libpg-query');
(async()=>{await loadModule();
for (const f of require('fs').readdirSync('supabase').filter(f=>f.endsWith('.sql')))
  try { const t=await parse(require('fs').readFileSync('supabase/'+f,'utf8'));
        console.log('OK  ',f,t.stmts.length,'statements'); }
  catch(e){ console.log('FAIL',f,e.message.split('\n')[0]); }
})()"
```

This is syntax only. It does not prove the sequence applies cleanly to an
empty database — that needs a real Postgres, and there is none in the
development environment these were written in.

## Access control

`tests/security.rls.test.ts` (`npm run test:security`) checks, against a
**separate test project** (`SUPABASE_TEST_URL`, `SUPABASE_TEST_KEY`), that
the anonymous role cannot set statuses ④/⑤, cannot read device ids or
precise positions, and cannot write columns a submission does not need.
It refuses to run against the production URL. The positive case — that
the service role can — runs only when `SUPABASE_TEST_SERVICE_KEY` is set.
Never commit those keys or paste them into a chat.
