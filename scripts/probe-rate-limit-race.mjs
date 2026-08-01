#!/usr/bin/env node
/* ─────────────────────────────────────────────────────────────
   AETHERIS · concurrency probe for the report rate limiter
   ─────────────────────────────────────────────────────────────
   Fires N submissions from one device id simultaneously and reports how
   many the database actually accepted. The hourly limit is 5, so:

     accepted <= 5  → the limit held
     accepted >  5  → the read-committed race is open

   Run it BEFORE applying supabase/rate-limit-concurrency.sql to see the
   race, and AFTER to see it closed. It is the evidence for that file;
   without it the fix is an argument rather than a result.

   IT WRITES REAL ROWS. Every accepted submission is a public report in
   whatever database you point it at, and the anonymous role cannot delete
   them — the script prints the exact cleanup SQL at the end, which has to
   be run by hand in the SQL editor. Point it at a staging project if you
   have one. It refuses to run without --yes for that reason.

     node scripts/probe-rate-limit-race.mjs --yes
     node scripts/probe-rate-limit-race.mjs --yes --burst 12
     SUPABASE_URL=https://staging.supabase.co \
     SUPABASE_KEY=sb_publishable_… node scripts/probe-rate-limit-race.mjs --yes
   ───────────────────────────────────────────────────────────── */

const URL_BASE =
  process.env.SUPABASE_URL ?? "https://effxsftaolpjjlpuqwax.supabase.co";
const KEY =
  process.env.SUPABASE_KEY ?? "sb_publishable_YERf0Mpcy2YhOFyvIz5H1w_rQ9-H6go";

const args = process.argv.slice(2);
const has = (f) => args.includes(f);
const val = (f, d) => {
  const i = args.indexOf(f);
  return i === -1 ? d : Number(args[i + 1]);
};

const HOURLY_LIMIT = 5;
const burst = val("--burst", 10);

if (!has("--yes")) {
  console.error(
    "Refusing to run without --yes: this writes real, public, undeletable rows.\n" +
      "Read the header of this file first.",
  );
  process.exit(1);
}

// One throwaway device id per run, so the probe never counts against — or
// is confused by — a real contributor's submissions.
const anonId = `race-probe-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const headers = {
  apikey: KEY,
  Authorization: `Bearer ${KEY}`,
  "Content-Type": "application/json",
  Prefer: "return=representation",
};

function submission(i) {
  return {
    anon_id: anonId,
    author: "Anonymous",
    city: "Almaty",
    lat: 43.238,
    lon: 76.889,
    category: "air",
    severity: "low",
    title: `RATE-LIMIT RACE PROBE ${i} — automated, safe to delete`,
    body:
      "Written by scripts/probe-rate-limit-race.mjs to measure whether the " +
      "per-device rate limit holds under concurrent submissions. Not a real observation.",
  };
}

const started = Date.now();

// Promise.all, not a loop with await: the whole point is that these are in
// flight at the same time. Awaiting each one in turn tests the sequential
// path, which was never the broken one.
const results = await Promise.all(
  Array.from({ length: burst }, (_, i) =>
    fetch(`${URL_BASE}/rest/v1/reports`, {
      method: "POST",
      headers,
      body: JSON.stringify(submission(i + 1)),
    })
      .then(async (r) => ({ status: r.status, body: await r.text() }))
      .catch((e) => ({ status: 0, body: String(e) })),
  ),
);

const accepted = results.filter((r) => r.status === 201);
const rateLimited = results.filter((r) => r.body.includes("rate_limit_hourly"));
const other = results.filter(
  (r) => r.status !== 201 && !r.body.includes("rate_limit_hourly"),
);

console.log(`\ndevice id      : ${anonId}`);
console.log(`fired          : ${burst} concurrent submissions in ${Date.now() - started} ms`);
console.log(`accepted (201) : ${accepted.length}`);
console.log(`rate-limited   : ${rateLimited.length}`);
console.log(`other failures : ${other.length}`);
if (other.length) console.log(`  first other  : HTTP ${other[0].status} ${other[0].body.slice(0, 140)}`);

console.log(
  `\nhourly limit is ${HOURLY_LIMIT}. ` +
    (accepted.length > HOURLY_LIMIT
      ? `RACE OPEN — ${accepted.length} rows landed, ${accepted.length - HOURLY_LIMIT} over the limit.`
      : `Limit held: ${accepted.length} <= ${HOURLY_LIMIT}.`),
);

console.log(
  `\nCleanup (anon cannot delete; run in the SQL editor):\n` +
    `  delete from public.reports where anon_id = '${anonId}';\n`,
);

process.exit(accepted.length > HOURLY_LIMIT ? 1 : 0);
