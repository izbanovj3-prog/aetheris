// Lighthouse, mobile profile, median of 3 runs per page, against targets.
//
//   node scripts/lighthouse-check.mjs [baseUrl]     (default http://localhost:4321)
//
// Targets: Performance ≥ 80, Accessibility ≥ 95, Best Practices ≥ 95,
// SEO ≥ 95. An exception is allowed only when it is listed below with its
// reason — a lowered number with no reason next to it is not allowed.
// Writes a JSON summary to lighthouse-summary.json.
//
// With LH_FIXTURE=1 the community feed comes from scripts/supabase-fixture.mjs
// — the same FIXTURE_ROWS reports every run — instead of a real project, so
// the score on /community/ does not move with whatever a shared test
// database holds that day. The site must then be built with
// NEXT_PUBLIC_SUPABASE_URL set to FIXTURE_URL (CI does; see ci.yml). Chrome
// is pointed at the fixture by --host-resolver-rules, so the bundle, CSP and
// request path are the ones a visitor gets; only the answer is fixed.
import { spawn } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { FIXTURE_HOST, startFixture } from "./supabase-fixture.mjs";

const BASE = (process.argv[2] ?? "http://localhost:4321").replace(/\/$/, "");
const PAGES = ["/", "/map/", "/dashboard/", "/community/"];
const TARGET = { performance: 80, accessibility: 95, "best-practices": 95, seo: 95 };
const EXCEPTIONS = {
  // MapLibre GL renders the whole map in WebGL. Lighthouse's mobile run has
  // no GPU (software WebGL) and a 4× CPU slowdown, so initialising the map
  // is one 1–1.5 s main-thread task. Desktop profile: 94. Accepted by the
  // owner on 2026-11-03 (README → Performance).
  "/map/": { performance: 60 },
};
const RUNS = Number(process.env.LH_RUNS ?? 3);
// Lighthouse's mobile profile slows the host CPU 4×, so a slow host scores
// low for reasons that are not the page's. Lighthouse itself flags a run as
// not representative when the host's benchmark index is at or below 1000
// (SLOW_CPU_BENCHMARK_INDEX_THRESHOLD in
// node_modules/lighthouse/core/gather/driver/environment.js). Such runs are
// dropped and retried; if too few valid runs remain, the check fails and
// says the host was too slow — it never passes on fewer runs.
const SLOW_HOST_INDEX = 1000;
const MAX_ATTEMPTS = RUNS * 3;
const OUT = join(process.cwd(), "lighthouse-reports");
mkdirSync(OUT, { recursive: true });

const chrome = process.env.CHROME_PATH;

/** Run a command to completion without blocking this process — the
 *  fixture server below lives here and has to keep answering. */
function run(cmd, args, env) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: "inherit", env });
    child.on("error", reject);
    child.on("close", (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} exited ${code}`))));
  });
}

// Three pages of the feed (20 each): the first page is full and "Show more"
// is on screen, as it is for a visitor once the feed is in use.
const FIXTURE_ROWS = 60;
const FIXTURE_PORT = 4443;
const fixture = process.env.LH_FIXTURE === "1" ? await startFixture(FIXTURE_PORT, FIXTURE_ROWS) : null;
const chromeFlags = [
  "--headless=new",
  "--no-sandbox",
  ...(fixture
    ? [`--host-resolver-rules="MAP ${FIXTURE_HOST} 127.0.0.1:${FIXTURE_PORT}"`, "--ignore-certificate-errors"]
    : []),
  // Extra flags for this machine only, e.g. --no-proxy-server behind an
  // HTTP proxy, which would otherwise resolve the fixture host itself.
  ...(process.env.LH_CHROME_FLAGS ? [process.env.LH_CHROME_FLAGS] : []),
].join(" ");
if (fixture) console.log(`community feed: ${FIXTURE_ROWS} fixed reports from scripts/supabase-fixture.mjs`);
const results = {};
let failed = false;

for (const page of PAGES) {
  const scores = [];
  for (let attempt = 0; scores.length < RUNS && attempt < MAX_ATTEMPTS; attempt++) {
    const file = join(OUT, `${page.replace(/\//g, "_") || "_"}-${attempt}.json`);
    // Lighthouse itself sometimes fails to record the page load (e.g.
    // NO_NAVSTART: "Please run Lighthouse again"). That run measured
    // nothing, so it is dropped and retried like an unrepresentative one.
    let report;
    try {
      await run(
        "npx",
        [
          "lighthouse",
          `${BASE}${page}`,
          "--quiet",
          "--output=json",
          `--output-path=${file}`,
          "--only-categories=performance,accessibility,best-practices,seo",
          `--chrome-flags=${chromeFlags}`,
        ],
        { ...process.env, ...(chrome ? { CHROME_PATH: chrome } : {}) },
      );
      report = JSON.parse(readFileSync(file, "utf8"));
    } catch {
      console.log(`skip ${page.padEnd(13)} attempt ${attempt + 1}: Lighthouse did not complete the run`);
      continue;
    }
    if (report.runtimeError) {
      console.log(`skip ${page.padEnd(13)} attempt ${attempt + 1}: Lighthouse runtime error ${report.runtimeError.code}`);
      continue;
    }
    // A fixture run whose build points elsewhere would measure some other
    // feed and still look fine, so it is a failure, not a pass.
    if (fixture && page === "/community/") {
      const fed = (report.audits["network-requests"]?.details?.items ?? []).some(
        (i) => i.url.startsWith(`https://${FIXTURE_HOST}/rest/v1/reports`) && i.statusCode === 200,
      );
      if (!fed) {
        console.log(`FAIL ${page.padEnd(13)} the feed did not come from the fixture — build with NEXT_PUBLIC_SUPABASE_URL=https://${FIXTURE_HOST}`);
        failed = true;
        break;
      }
    }
    const bench = Math.round(report.environment?.benchmarkIndex ?? 0);
    if (bench <= SLOW_HOST_INDEX) {
      console.log(`skip ${page.padEnd(13)} attempt ${attempt + 1}: host benchmark index ${bench} ≤ ${SLOW_HOST_INDEX}, not representative`);
      continue;
    }
    const cats = report.categories;
    scores.push(Object.fromEntries(Object.entries(cats).map(([k, v]) => [k, Math.round(v.score * 100)])));
    console.log(`run  ${page.padEnd(13)} attempt ${attempt + 1}: benchmark index ${bench}, performance ${scores.at(-1).performance}`);
  }
  if (scores.length < RUNS) {
    console.log(`FAIL ${page.padEnd(13)} only ${scores.length} of ${RUNS} valid runs in ${MAX_ATTEMPTS} attempts (slow host or Lighthouse errors, listed above)`);
    failed = true;
    results[page] = null;
    continue;
  }
  const median = {};
  for (const k of Object.keys(TARGET)) {
    const v = scores.map((s) => s[k]).sort((a, b) => a - b);
    median[k] = v[Math.floor(v.length / 2)];
  }
  results[page] = median;
  for (const [k, min] of Object.entries(TARGET)) {
    const need = EXCEPTIONS[page]?.[k] ?? min;
    const ok = median[k] >= need;
    if (!ok) failed = true;
    console.log(`${ok ? "ok  " : "FAIL"} ${page.padEnd(13)} ${k.padEnd(15)} ${median[k]} (need ${need}${need !== min ? `, target ${min}` : ""})`);
  }
}

writeFileSync("lighthouse-summary.json", JSON.stringify(results, null, 2));
fixture?.close();
process.exit(failed ? 1 : 0);
