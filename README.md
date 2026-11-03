# AETHERIS — Kazakhstan Environmental Intelligence

An independent student project: Kazakhstan's environment on one map, in
English, Russian and Kazakh, at [aetherisearth.live](https://aetherisearth.live).

What is real and what is modelled, plainly:

- **Measured / open data, fetched in the browser:** air quality (US AQI,
  PM2.5, PM10, NO₂ from the CAMS model) and weather from Open-Meteo
  (`lib/live.ts`); species-occurrence counts from GBIF (`lib/gbif.ts`). If
  a request fails, the page falls back to the model and does not show
  "Live".
- **Modelled estimates:** water, industrial pollution, biodiversity and
  ecological risk for 28 cities (`lib/data.ts`, seeded and deterministic,
  so every page shows the same figure for a city). They are marked as
  modelled on the site, and `tests/honesty.test.ts` keeps it that way.
- **The assistant** (`lib/ai.ts`) is a deterministic engine over that same
  data, not a language model. Every answer with figures opens with
  "Modelled estimates, not measurements".
- **Resident reports** go to Supabase. Photos stay on the device and are
  never uploaded; public positions are rounded to about 1 km. Status ③ is
  "Matches other reports" — the code never calls a report verified or
  confirmed.
- **Privacy policy and terms** (`/privacy`, `/terms`) are drafts pending
  legal review and say so on the page. Kazakh texts are pending review by
  a native speaker (`docs/kk-review.md`).

## Run locally

Node 22 (CI uses 22). No API keys are needed.

```bash
npm ci
```

```bash
npm run dev            # http://localhost:3000
```

```bash
npm run build          # static export → out/ (output: "export")
```

```bash
npm run serve:static   # serves out/ on :4321 with the headers from vercel.json
```

This is Next.js 16 with breaking changes from older versions — read
`node_modules/next/dist/docs/` before changing framework code
(`AGENTS.md`). Because the site is a static export, `headers()`,
redirects and rewrites in `next.config.ts` do nothing; HTTP headers live
in `vercel.json` (`docs/security.md`).

Environment variables are listed, without values, in `.env.example`.
Every `NEXT_PUBLIC_*` value ends up in the public bundle — never put a
secret in one. Real values go in `.env.local`, which git ignores.

## Tests

| Command | What it checks | Needs |
| --- | --- | --- |
| `npx tsc --noEmit` | types | — |
| `npm test` | unit tests over the pure logic (points, statuses, sitemap, copy rules, honesty) and `schema.test.ts`, which replays every migration on PGlite and probes what each database role can do | nothing; offline, ~10 s |
| `npx playwright test` | end to end against `out/`: the report flow in three languages, headers and CSP, layout and axe contrast at 5 widths × 3 modes, SEO, 404s, no-JS reading | `npm run build` first; Chromium |
| `npm run lighthouse` | mobile profile, median of 3, against the targets in `scripts/lighthouse-check.mjs` | a server on :4321 (`npm run serve:static`) |
| `npm run test:security` | access control on a **separate test** Supabase project, over the REST API with the publishable key | `SUPABASE_TEST_URL`, `SUPABASE_TEST_KEY`; optional `SUPABASE_TEST_SERVICE_KEY`, `SECURITY_PROBE_NETWORK=1` |

`test:security` refuses to run against the production URL. Without its
variables it runs only the offline key check and reports the rest as
skipped — a skip is not a pass, which is why CI fails when they are
missing.

E2E tests never write to a database: every spec stubs Supabase writes
with `page.route`. With `E2E_BASE_URL` set they run against a deployed
site instead of `out/` (see "Checking a deployment").

Not covered: concurrency. PGlite is a single connection, so the advisory
locks behind the rate limits are checked for correctness, not contention —
that needs `scripts/probe-rate-limit-race.mjs` against a real server.

### Performance

Targets: Performance ≥ 80, Accessibility ≥ 95, Best Practices ≥ 95,
SEO ≥ 95. One exception, accepted by the owner: `/map/` on the mobile
profile scores about 66 (desktop 94), because MapLibre initialises the
whole map in one WebGL task and Lighthouse's mobile run has no GPU. The
exception and its reason are in `scripts/lighthouse-check.mjs`; nothing
else may be lowered without a reason written next to it.

## CI (GitHub Actions)

`.github/workflows/ci.yml` — on every pull request into `main`, every push
to `main`, and by hand:

1. **Typecheck, unit tests, build** — `out/` is kept as an artifact.
2. **Playwright + axe** against that `out/`.
3. **Lighthouse (mobile)** against that `out/`.
4. **Access control (test Supabase)** — fails if the test project secrets
   are missing.

`.github/workflows/preview.yml` — **Deployment check**: whenever Vercel
reports a deployment as ready (each preview, and production after a
merge), the full Playwright suite runs against the deployed URL. It can
also be started by hand from the Actions tab with a URL.

Repository secrets used:

| Secret | Used by | Required |
| --- | --- | --- |
| `SUPABASE_TEST_URL`, `SUPABASE_TEST_KEY` | CI → access control | yes |
| `SUPABASE_TEST_SERVICE_KEY` | CI → service-role half of access control | no (those checks are skipped) |
| `VERCEL_AUTOMATION_BYPASS_SECRET` | Deployment check, while Vercel Deployment Protection is on for previews | yes, while protection is on |

## Deploy

Hosting is Vercel through its Git integration: every push to a branch
builds a preview, and a merge into `main` builds and publishes production.
Nothing is deployed from this repository by script.

Order for a release that includes database changes (details in
`supabase/README.md`):

1. Open a pull request into `main`. CI must be green, and the Deployment
   check must pass on its preview.
2. Merge. Vercel publishes the front-end. The current front-end works
   with the database both before and after the newest migration; the
   previous one does not work after it — so **front-end first**.
3. Check production: the Deployment check runs on the production
   deployment; then look over aetherisearth.live by hand, without
   submitting a report.
4. Back up the database, then apply the pending migrations in the
   Supabase SQL editor, in the order in `supabase/README.md`, and update
   its "Applied state".

Merging into `main` and applying migrations to production are owner
decisions.

## Roll back

**Front-end.** In the Vercel dashboard, open the project's Deployments,
pick the last good production deployment and use Instant Rollback (or
"Promote to Production"). It takes effect without a rebuild. After an
Instant Rollback, Vercel stops pointing the production domain at new
deployments until one is promoted again — check the project page before
the next release. To make the rollback permanent in git, revert on `main`
in a new pull request — `git revert -m 1 <merge-sha>` for a merge commit,
`git revert <sha>` for a squash merge — never by force-pushing.

**Database.** `supabase/rollback/privacy-hardening.down.sql` restores the
access model from before migration 7. It cannot restore precise
coordinates — only the backup taken before applying 7 has them. Roll back
the database only together with a front-end that works with the older
schema.

## Checking a deployment

```bash
E2E_BASE_URL=https://<deployment>.vercel.app npx playwright test
```

Against a deployment the specs stub only requests that leave the site's
own origin, so the deployment itself — Vercel's headers, CSP, routing,
404s — is what gets tested, and the header/console check makes real
(read-only) requests to the data sources. If previews are behind Vercel
Deployment Protection, set `VERCEL_AUTOMATION_BYPASS_SECRET`: it is traded
once for a cookie scoped to the deployment's host
(`tests/e2e/vercel-bypass.setup.ts`), and traces are off in that mode so
no artifact carries it.

Known: the Vercel Toolbar on previews is not allowed by the CSP and can
log CSP errors there, which the header/console check reports. Production
has no toolbar. Turning it off for previews is a project setting
(`docs/security.md`).

## Layout

```
app/             routes (App Router, all prerendered); /ru and /kk trees
components/      chrome, map, dashboard, assistant, community, ui
lib/             site.ts (metadata), data.ts (model), live.ts + gbif.ts (open data),
                 supabase.ts (PostgREST client), i18n.ts + communityText.ts (copy)
supabase/        migrations 1–7, rollback/, README (order, applied state)
scripts/         serve-static, lighthouse-check, og-images, forward-report, probe-rate-limit-race
tests/           unit (vitest) · e2e/ (Playwright) · security.rls.test.ts
docs/            security, legal-review, kk-review, terminology
```

## Documents

`CONTEXT.md` — status of the launch work, decisions and their reasons ·
`supabase/README.md` — migrations, applied state, rollback ·
`docs/security.md` — headers, CSP trade-offs, dependency audit ·
`docs/legal-review.md` — open questions for lawyers ·
`docs/kk-review.md` — Kazakh texts for a native speaker ·
`docs/terminology.md` — terms to check against the Ecological Code.
