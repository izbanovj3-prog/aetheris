# Security notes

## HTTP headers (`vercel.json`)

`output: "export"` means Next.js does not serve the site, so `headers()` in
`next.config.ts` is ignored (Next docs → static exports → unsupported
features). Headers are set by Vercel from `vercel.json`, and
`scripts/serve-static.mjs` applies the same file locally so the e2e tests
run against the real policy.

| Header | Value | Why |
| --- | --- | --- |
| Content-Security-Policy | see `vercel.json` | sources limited to the site itself, Supabase, Open-Meteo, GBIF and CARTO tiles; `worker-src blob:` for MapLibre workers; `frame-ancestors 'none'`; no `unsafe-eval` |
| Strict-Transport-Security | `max-age=31536000; includeSubDomains` | no `preload`: joining the preload list is hard to undo and is the owner's decision |
| X-Content-Type-Options | `nosniff` | |
| X-Frame-Options | `DENY` | for browsers without `frame-ancestors` |
| Referrer-Policy | `strict-origin-when-cross-origin` | |
| Cross-Origin-Opener-Policy | `same-origin` | |
| Permissions-Policy | camera, microphone and sensors off; `geolocation=(self)` | |

Trade-offs, stated:

- **`script-src 'unsafe-inline'`.** The static export inlines a hydration
  payload per page; a static host cannot add nonces, and per-page hashes
  would have to be regenerated on every build. Mitigation: no third-party
  scripts at all, no `unsafe-eval`, user text is rendered by React (escaped).
- **`geolocation=(self)` site-wide**, not only on `/community`. The site is
  a client-side app: navigating from `/` to `/community` keeps the first
  page's policy, so a path-scoped policy would break the report form and
  event check-in for anyone who did not land on `/community` directly.
- **The photo input does not need `camera`.** `<input type="file"
  capture>` opens the OS picker; it does not use `getUserMedia`.
- **Vercel Toolbar on previews** (`vercel.live`) is not allowed by the CSP,
  so on preview deployments the toolbar may log CSP errors. Production is
  unaffected. Disable the toolbar in the Vercel project settings if that is
  noise.

`tests/e2e/headers-console.spec.ts` checks the headers and that 19 key
routes produce no CSP violation and no console error. Removing `blob:` from
`worker-src` makes it fail — it is not a vacuous check.

The www → apex redirect is a Vercel domain setting, not `vercel.json`
(adding one here could loop against the dashboard setting); it is checked
after deploy.

## Dependency audit (2026-11-03)

`npm audit fix` applied; `next` 16.2.9 → 16.4.4 (same major). Remaining:

| Package | Severity | Status |
| --- | --- | --- |
| `maplibre-gl` ≤ 6.4.0 | critical — XSS sanitizer bypass in `DOM.sanitize()` | fix only in 6.x (major). Not reachable here: the sanitizer only sees the attribution string from our own static config; no `Popup.setHTML` or other HTML from user input. Upgrade to 6.x as a separate task. |
| `vitest` 3 → `tinypool`, `@vitest/mocker` | critical / moderate | dev-only test runner, never shipped; fix is vitest 5 (major). Separate task. |

`npm audit --omit=dev` lists only `maplibre-gl`.

## Known limits (independent review, 2026-11-03)

Fixed on the branch: device ids published before migration 7 are burned;
RSVPs and check-ins have a network limit and RSVPs refuse cancelled or past
events; deleting a report recounts ③; a declined insert is reported as
refused instead of being kept on the device. The rest, stated plainly:

- **Status ③ counts devices, not people.** Clearing site data gives a new
  device id, so one person can bring a city/category to "Matches other
  reports". The copy says "two devices — not necessarily two people".
  Counting network hashes as well would need storing a hash per report
  for 72 hours — a privacy decision for the owner.
- **Where the network limit takes the address from.** `cf-connecting-ip`,
  else the first entry of `x-forwarded-for`, which a client may be able to
  set. IPv6 addresses are hashed whole, so one /64 can rotate. Without
  either header the limit is skipped (SQL editor, scripts). Whether
  Supabase's edge lets a client forge these is checked by the opt-in probe
  (CI → Run workflow → `probe_network`). Result on the test project,
  2026-11-03 (CI run 41704978984): a client-set `CF-Connecting-IP` is
  refused by the edge with an HTML 403; with a different forged
  `X-Forwarded-For` on every request the limit still stopped the sender
  at 30 an hour ("accepted 26, refused at 26", after 4 earlier inserts
  from the same run). So header forgery does not move the limit; IPv6
  /64 rotation was not probed.
- **The daily salt changes at 00:00 UTC**, so a sender's hourly/daily
  count restarts then.
- **Corroboration takes no lock.** Two first reports at the same moment
  may each see one device and leave both at ①. That understates, never
  overstates.
- **The Deployment check runs the deployed commit's code with the bypass
  secret.** Vercel must keep fork protection on (a fork's pull request is
  not built until a member approves it); otherwise a fork could ship its
  own workflow and read the secret. For a stricter setup, keep the secret
  in a GitHub Environment with required reviewers.
