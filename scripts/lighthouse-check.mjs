// Lighthouse, mobile profile, median of 3 runs per page, against targets.
//
//   node scripts/lighthouse-check.mjs [baseUrl]     (default http://localhost:4321)
//
// Targets: Performance ≥ 80, Accessibility ≥ 95, Best Practices ≥ 95,
// SEO ≥ 95. An exception is allowed only when it is listed below with its
// reason — a lowered number with no reason next to it is not allowed.
// Writes a JSON summary to lighthouse-summary.json.
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

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
const results = {};
let failed = false;

for (const page of PAGES) {
  const scores = [];
  for (let attempt = 0; scores.length < RUNS && attempt < MAX_ATTEMPTS; attempt++) {
    const file = join(OUT, `${page.replace(/\//g, "_") || "_"}-${attempt}.json`);
    execFileSync(
      "npx",
      [
        "lighthouse",
        `${BASE}${page}`,
        "--quiet",
        "--output=json",
        `--output-path=${file}`,
        "--only-categories=performance,accessibility,best-practices,seo",
        "--chrome-flags=--headless=new --no-sandbox",
      ],
      { stdio: "inherit", env: { ...process.env, ...(chrome ? { CHROME_PATH: chrome } : {}) } },
    );
    const report = JSON.parse(readFileSync(file, "utf8"));
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
    console.log(`FAIL ${page.padEnd(13)} only ${scores.length} of ${RUNS} runs on a host fast enough for Lighthouse — re-run on another machine`);
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
process.exit(failed ? 1 : 0);
