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

Every file is idempotent — `create or replace`, `if not exists`,
`drop … if exists` — so re-running one is safe and re-running the whole
sequence on an existing database is a no-op apart from the constraint
rebuilds.

## Applied state

Files 1–5 are applied to the production project. **File 6 is not.**
Nothing here tracks that automatically; this line is the record, and it
has to be updated by whoever runs one.

## Checking them without a server

`tests/schema.test.ts` replays every file in the order above against a
brand-new Postgres — PGlite, the real engine compiled to WASM — then
creates `anon`, `authenticated` and `service_role` the way Supabase does
and probes what each can actually reach. It runs in `npm test`, offline,
in about a second and a half.

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

`tests/security.rls.test.ts` (`npm run test:security`) checks that the
anonymous role cannot set statuses ④/⑤ by any route. The positive case —
that the service role can — is in the same file but only runs when
`SUPABASE_SERVICE_KEY` is set in the environment. Never commit that key
or paste it into a chat.
