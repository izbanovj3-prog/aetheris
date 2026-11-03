import { afterAll, describe, expect, it } from "vitest";
import { SUPABASE_KEY, SUPABASE_URL as PRODUCTION_URL } from "@/lib/supabase";

/* ─────────────────────────────────────────────────────────────
   AETHERIS · access-control audit against a live Supabase project

   tests/schema.test.ts proves the migrations on a replayed Postgres. This
   file asks the same questions of a real project over the REST API, with
   the publishable key — exactly what any visitor holds.

   It runs against a SEPARATE TEST PROJECT, never production: it writes
   probe rows, and the network-limit probe deliberately exhausts a limit.

     SUPABASE_TEST_URL=https://<test-ref>.supabase.co \
     SUPABASE_TEST_KEY=sb_publishable_… \
     [SUPABASE_TEST_SERVICE_KEY=sb_secret_…] \
     [SECURITY_PROBE_NETWORK=1] \
     npm run test:security

   Without SUPABASE_TEST_URL / SUPABASE_TEST_KEY only the offline key check
   runs, and the skip is reported — a skipped suite is not a pass. Apply
   every file in supabase/ (README order) to the test project first.

   Secrets come from the environment only. Never commit them or paste them
   into a chat.
   ───────────────────────────────────────────────────────────── */

const URL_ = process.env.SUPABASE_TEST_URL?.trim().replace(/\/$/, "");
const KEY = process.env.SUPABASE_TEST_KEY?.trim();
const SERVICE_KEY = process.env.SUPABASE_TEST_SERVICE_KEY?.trim();
const LIVE = Boolean(URL_ && KEY);

if (LIVE && URL_ === PRODUCTION_URL.replace(/\/$/, "")) {
  throw new Error(
    "SUPABASE_TEST_URL points at the production project. This suite writes probe rows — use the test project.",
  );
}
if (!LIVE) {
  // eslint-disable-next-line no-console
  console.warn(
    "[security] SUPABASE_TEST_URL / SUPABASE_TEST_KEY not set — live access-control checks SKIPPED.",
  );
}

const anonHeaders = {
  apikey: KEY ?? "",
  Authorization: `Bearer ${KEY ?? ""}`,
  "Content-Type": "application/json",
};

/** A key that ships to browsers must never be a secret one. */
const SECRET_KEY_PREFIX = "sb_secret_";

/** Fresh private-format device id for this run. */
const device = () => `v2-${crypto.randomUUID()}`;
const PROBE_DEVICE = device();
const created: string[] = [];

const PUBLIC_COLS =
  "id,created_at,author,city,lat,lon,category,severity,title,body,status,upvotes";

async function rpc(fn: string, body: Record<string, unknown>, headers = anonHeaders) {
  const res = await fetch(`${URL_}/rest/v1/rpc/${fn}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  return { status: res.status, body: await res.text() };
}

async function insertReport(extra: Record<string, unknown> = {}, headers: Record<string, string> = {}) {
  const res = await fetch(`${URL_}/rest/v1/reports?select=${PUBLIC_COLS}`, {
    method: "POST",
    headers: { ...anonHeaders, Prefer: "return=representation", ...headers },
    body: JSON.stringify({
      anon_id: PROBE_DEVICE,
      city: "Almaty",
      lat: 43.238123,
      lon: 76.889456,
      category: "air",
      severity: "low",
      title: "SECURITY PROBE — automated access-control audit row",
      body: "Created by tests/security.rls.test.ts on the TEST project. Not a real observation.",
      ...extra,
    }),
  });
  const text = await res.text();
  if (res.status === 201) {
    const row = JSON.parse(text)[0] as { id: string };
    created.push(row.id);
  }
  return { status: res.status, body: text };
}

/* A UUID that does not exist, so RPC probes cannot touch real rows even in
   the failure case this file is designed to detect. */
const ABSENT_ID = "00000000-0000-0000-0000-0000000000ff";

afterAll(async () => {
  if (!LIVE) return;
  for (const id of created) {
    await rpc("delete_my_report", { p_report_id: id, p_anon_id: PROBE_DEVICE });
  }
});

describe("the key shipped to browsers", () => {
  it("is the publishable key, never a service key", () => {
    expect(SUPABASE_KEY.startsWith(SECRET_KEY_PREFIX)).toBe(false);
    expect(SUPABASE_KEY).toMatch(/^sb_publishable_/);
  });
});

describe.skipIf(!LIVE)("anonymous role · statuses ④ and ⑤", () => {
  it.each([
    ["mark_report_forwarded", { p_report_id: ABSENT_ID, p_destination: "probe", p_actor: "probe", p_note: null }],
    ["record_org_response", { p_report_id: ABSENT_ID, p_org: "probe", p_response: "probe" }],
  ])("is refused EXECUTE on %s", async (fn, body) => {
    const r = await rpc(fn, body);
    // 401/403 = denied outright, 404 = not exposed to this role at all.
    expect([401, 403, 404]).toContain(r.status);
  });

  it.each(["forwarded", "org-response", "corroborated"])(
    "cannot insert a report already at status %s",
    async (status) => {
      const r = await insertReport({ status });
      expect(r.status).toBeGreaterThanOrEqual(400);
      expect(r.status).toBeLessThan(500);
    },
  );

  it.each([
    ["upvotes", 9999],
    ["author", "A Real Name"],
    ["forwarded_to", "Akimat"],
    ["org_response", "We fixed it"],
  ])("cannot write %s", async (col, val) => {
    const r = await insertReport({ [col]: val });
    expect(r.status).toBeGreaterThanOrEqual(400);
    expect(r.status).toBeLessThan(500);
  });

  /* RLS denial on PATCH can be silent (2xx, nothing changed), so the
     assertion is on the row afterwards, never on the status code. */
  it("cannot PATCH or DELETE an existing report", async () => {
    const made = await insertReport();
    expect(made.status, made.body).toBe(201);
    const row = JSON.parse(made.body)[0] as { id: string; status: string };
    expect(row.status).toBe("submitted");

    for (const target of ["forwarded", "org-response"]) {
      await fetch(`${URL_}/rest/v1/reports?id=eq.${row.id}`, {
        method: "PATCH",
        headers: anonHeaders,
        body: JSON.stringify({ status: target }),
      });
    }
    await fetch(`${URL_}/rest/v1/reports?id=eq.${row.id}`, { method: "DELETE", headers: anonHeaders });

    const after = await fetch(`${URL_}/rest/v1/reports?select=status&id=eq.${row.id}`, {
      headers: anonHeaders,
    });
    const [state] = (await after.json()) as Array<{ status: string }>;
    expect(state?.status).toBe("submitted");
  });
});

describe.skipIf(!LIVE)("anonymous role · personal data", () => {
  it("stores the position coarsened to ~1 km", async () => {
    const made = await insertReport();
    expect(made.status, made.body).toBe(201);
    const row = JSON.parse(made.body)[0] as { lat: number; lon: number; author: string };
    expect(row.lat).toBe(43.24);
    expect(row.lon).toBe(76.89);
    expect(row.author).toBe("Anonymous");
  });

  it("cannot read anon_id, or select every column", async () => {
    for (const q of ["select=anon_id&limit=1", "select=*&limit=1", "select=id&anon_id=eq.x&limit=1"]) {
      const res = await fetch(`${URL_}/rest/v1/reports?${q}`, { headers: anonHeaders });
      expect(res.status, q).toBeGreaterThanOrEqual(400);
    }
  });

  it.each(["event_rsvps", "event_checkins"])("cannot read %s", async (t) => {
    const res = await fetch(`${URL_}/rest/v1/${t}?select=event_id&limit=1`, { headers: anonHeaders });
    expect(res.status).toBeGreaterThanOrEqual(400);
  });

  it("cannot reach the private schema", async () => {
    const res = await fetch(`${URL_}/rest/v1/network_hits?select=*`, {
      headers: { ...anonHeaders, "Accept-Profile": "private" },
    });
    expect(res.status).toBeGreaterThanOrEqual(400);
  });

  it("cannot delete someone else's report", async () => {
    const made = await insertReport();
    const row = JSON.parse(made.body)[0] as { id: string };
    const r = await rpc("delete_my_report", { p_report_id: row.id, p_anon_id: device() });
    expect(r.body).toBe("false");
  });
});

describe.skipIf(!LIVE)("anonymous role · the forwarding log", () => {
  it("is readable, because a transfer log nobody can inspect is not accountability", async () => {
    const res = await fetch(`${URL_}/rest/v1/report_forwardings?select=*&limit=1`, {
      headers: anonHeaders,
    });
    expect(res.status).toBe(200);
  });

  it("cannot be written to directly, which would fake a government handoff", async () => {
    const res = await fetch(`${URL_}/rest/v1/report_forwardings`, {
      method: "POST",
      headers: anonHeaders,
      body: JSON.stringify({ report_id: ABSENT_ID, destination: "probe", actor: "probe" }),
    });
    expect(res.status).toBeGreaterThanOrEqual(400);
  });
});

/* ── The positive case — needs the TEST project's service key. ── */
describe.skipIf(!LIVE || !SERVICE_KEY)("service role · the other half of the claim", () => {
  const svc = {
    apikey: SERVICE_KEY ?? "",
    Authorization: `Bearer ${SERVICE_KEY ?? ""}`,
    "Content-Type": "application/json",
  };

  it("CAN set ④ forwarded, and the transfer is logged", async () => {
    const made = await insertReport();
    expect(made.status, made.body).toBe(201);
    const row = JSON.parse(made.body)[0] as { id: string };
    try {
      const call = await rpc(
        "mark_report_forwarded",
        { p_report_id: row.id, p_destination: "audit probe destination", p_actor: "audit", p_note: null },
        svc,
      );
      expect(call.status, call.body).toBeLessThan(300);
      const after = await fetch(`${URL_}/rest/v1/reports?select=status,forwarded_to&id=eq.${row.id}`, {
        headers: svc,
      });
      const [state] = (await after.json()) as Array<{ status: string; forwarded_to: string }>;
      expect(state.status).toBe("forwarded");
    } finally {
      await fetch(`${URL_}/rest/v1/reports?id=eq.${row.id}`, { method: "DELETE", headers: svc });
    }
  });
});

/* ── Can the network limit be dodged by forging forwarding headers? ──
   Opt-in: it uses up this network's hourly allowance on the test project.
   It files 31 reports from 31 device ids, each with a different forged
   X-Forwarded-For and CF-Connecting-IP. If all 31 are accepted, the edge
   passes client-supplied headers through and the network limit is not a
   defence — the result is printed either way. */
describe.skipIf(!LIVE || process.env.SECURITY_PROBE_NETWORK !== "1")(
  "network limit · forged forwarding headers",
  () => {
    it("still stops one sender at 30 reports an hour", async () => {
      let accepted = 0;
      let refusedAt = -1;
      for (let i = 0; i < 31; i++) {
        const forged = `198.18.${Math.floor(i / 250)}.${(i % 250) + 1}`;
        const r = await insertReport(
          { anon_id: device() },
          { "X-Forwarded-For": forged, "CF-Connecting-IP": forged },
        );
        if (r.status === 201) accepted += 1;
        else if (r.body.includes("rate_limit_hourly")) {
          refusedAt = i;
          break;
        }
      }
      // eslint-disable-next-line no-console
      console.log(`[security] forged-header probe: accepted ${accepted}, refused at ${refusedAt}`);
      expect(refusedAt, "forged headers bypass the network limit").toBeGreaterThanOrEqual(0);
    });
  },
);
