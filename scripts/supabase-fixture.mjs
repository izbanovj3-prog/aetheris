// A stand-in for the Supabase REST API with a fixed set of community
// reports, so the Lighthouse run on /community/ measures the same feed every
// time instead of whatever the shared test project holds that day.
//
//   node scripts/supabase-fixture.mjs [port] [rows]   (default 4443, 60 rows)
//
// It speaks HTTPS with a throwaway self-signed certificate (made with
// openssl at start-up), because the site only accepts an https project URL
// and the CSP only allows *.supabase.co. Lighthouse points the build's
// project host at this server with Chrome's --host-resolver-rules and
// accepts the certificate with --ignore-certificate-errors; see
// scripts/lighthouse-check.mjs. Nothing here touches a real database.
//
// Only the reads the community page makes are answered: the reports feed
// (limit/offset, newest first), the id check, the row count, events and the
// RPCs. Everything else is 404, which the site treats as "not migrated".
import { createServer } from "node:https";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

/** The project host the Lighthouse build is pointed at. Never resolves for real. */
export const FIXTURE_HOST = "aetheris-lighthouse-fixture.supabase.co";
export const FIXTURE_URL = `https://${FIXTURE_HOST}`;
export const FIXTURE_KEY = "fixture-anon-key";

const CITIES = ["Almaty", "Astana", "Shymkent", "Karaganda", "Aktobe", "Pavlodar"];
const CATEGORIES = ["air", "water", "waste", "industrial", "air", "biodiversity"];
const SEVERITIES = ["low", "moderate", "high", "critical"];
const STATUSES = ["submitted", "submitted", "corroborated", "submitted", "forwarded"];
const BODY =
  "Grey haze over the district since the morning, a smell of burning coal near the ring road. " +
  "Visibility is lower than yesterday; writing it down so the pattern can be compared later.";

/** Deterministic rows: same input, same feed. Newest first, one hour apart. */
export function fixtureRows(n, now = Date.UTC(2026, 10, 1, 12)) {
  return Array.from({ length: n }, (_, i) => {
    const forwarded = STATUSES[i % STATUSES.length] === "forwarded";
    return {
      id: `00000000-0000-4000-8000-${String(i).padStart(12, "0")}`,
      created_at: new Date(now - i * 3_600_000).toISOString(),
      author: `Resident ${i + 1}`,
      city: CITIES[i % CITIES.length],
      lat: 43.24 + (i % 7) / 100,
      lon: 76.89 + (i % 5) / 100,
      category: CATEGORIES[i % CATEGORIES.length],
      severity: SEVERITIES[i % SEVERITIES.length],
      title: `Fixture report ${i + 1}: haze over the district`,
      body: BODY,
      status: STATUSES[i % STATUSES.length],
      upvotes: (i * 7) % 23,
      forwarded_at: forwarded ? new Date(now - i * 3_600_000 + 1_800_000).toISOString() : null,
      forwarded_to: forwarded ? "City akimat" : null,
      org_response: null,
      org_response_org: null,
      org_response_at: null,
      parent_id: null,
      photo_quality: false,
    };
  });
}

function selfSignedCert() {
  const dir = mkdtempSync(join(tmpdir(), "sb-fixture-"));
  const key = join(dir, "key.pem");
  const cert = join(dir, "cert.pem");
  execFileSync(
    "openssl",
    ["req", "-x509", "-newkey", "rsa:2048", "-nodes", "-days", "2", "-subj", `/CN=${FIXTURE_HOST}`,
      "-keyout", key, "-out", cert],
    { stdio: "ignore" },
  );
  return { key: readFileSync(key), cert: readFileSync(cert) };
}

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "apikey, authorization, content-type, prefer, range",
  "Access-Control-Allow-Methods": "GET, HEAD, POST, OPTIONS",
  "Access-Control-Expose-Headers": "Content-Range",
};

export function startFixture(port = 4443, rowCount = 60) {
  const rows = fixtureRows(rowCount);
  const server = createServer(selfSignedCert(), (req, res) => {
    const url = new URL(req.url ?? "/", FIXTURE_URL);
    const json = (status, body, extra = {}) => {
      res.writeHead(status, { ...CORS, "Content-Type": "application/json", ...extra });
      res.end(req.method === "HEAD" ? undefined : JSON.stringify(body));
    };
    if (req.method === "OPTIONS") {
      res.writeHead(204, CORS);
      return res.end();
    }
    const path = url.pathname;
    if (path === "/rest/v1/reports") {
      const ids = url.searchParams.get("id");
      if (ids?.startsWith("in.(")) {
        const want = new Set(ids.slice(4, -1).split(",").map((s) => s.replace(/"/g, "")));
        return json(200, rows.filter((r) => want.has(r.id)).map((r) => ({ id: r.id })));
      }
      const offset = Number(url.searchParams.get("offset") ?? 0);
      const limit = Number(url.searchParams.get("limit") ?? rows.length);
      const page = rows.slice(offset, offset + limit);
      const range = page.length ? `${offset}-${offset + page.length - 1}/${rows.length}` : `*/${rows.length}`;
      return json(200, page, { "Content-Range": range });
    }
    if (path === "/rest/v1/events") return json(200, []);
    if (path.startsWith("/rest/v1/rpc/")) return json(200, []);
    return json(404, { code: "PGRST205", message: "not in the fixture" });
  });
  return new Promise((resolve) => server.listen(port, "127.0.0.1", () => resolve(server)));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const port = Number(process.argv[2] ?? 4443);
  const n = Number(process.argv[3] ?? 60);
  await startFixture(port, n);
  console.log(`Supabase fixture: ${n} reports on https://127.0.0.1:${port} (as ${FIXTURE_HOST})`);
}
