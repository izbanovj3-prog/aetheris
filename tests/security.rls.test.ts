import { describe, expect, it } from "vitest";
import { SUPABASE_KEY, SUPABASE_URL } from "@/lib/supabase";

/* ─────────────────────────────────────────────────────────────
   AETHERIS · access-control audit for report statuses ④ and ⑤

   /methodology tells the public that "Передано в акимат/эко-инспекцию"
   and "Ответ организации" can only be set by a team member holding the
   service key. That is a claim about the database, and until this file
   existed it had never been checked against one.

   These tests use SUPABASE_KEY — the publishable key that ships in the
   browser bundle. That is the point: they exercise exactly the privileges
   any visitor has by opening the site and calling the REST API by hand.
   Nothing here uses a service key, and nothing here should ever pass by
   being granted one.

   Network-dependent, so it is not part of `npm test`. Run it with
   `npm run test:security` and treat a failure as a P0.

   NOT COVERED by this file, because the credentials do not exist in this
   environment: the positive case (service role CAN set ④/⑤) and the
   `authenticated` role (no user JWT — the platform has no login). Both
   are stated as gaps in the audit report rather than asserted here.
   ───────────────────────────────────────────────────────────── */

const anonHeaders = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  "Content-Type": "application/json",
};

/** A key that ships to browsers must never be a secret one. */
const SECRET_KEY_PREFIX = "sb_secret_";

async function rpc(fn: string, body: Record<string, unknown>) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, {
    method: "POST",
    headers: anonHeaders,
    body: JSON.stringify(body),
  });
  return { status: res.status, body: await res.text() };
}

async function insertReport(extra: Record<string, unknown>) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/reports`, {
    method: "POST",
    headers: { ...anonHeaders, Prefer: "return=representation" },
    body: JSON.stringify({
      anon_id: "rls-audit-probe-0001",
      author: "Anonymous",
      city: "Almaty",
      lat: 43.238,
      lon: 76.889,
      category: "air",
      severity: "low",
      title: "SECURITY PROBE — automated RLS audit row, safe to delete",
      body: "Created by tests/security.rls.test.ts to verify that the anonymous role cannot escalate a report status. Not a real observation.",
      ...extra,
    }),
  });
  return { status: res.status, body: await res.text() };
}

/* A UUID that does not exist. Used so the RPC probes cannot mutate real
   data even in the failure case this file is designed to detect. */
const ABSENT_ID = "00000000-0000-0000-0000-0000000000ff";

describe("the key shipped to browsers", () => {
  it("is the publishable key, never a service key", () => {
    expect(SUPABASE_KEY.startsWith(SECRET_KEY_PREFIX)).toBe(false);
    expect(SUPABASE_KEY).toMatch(/^sb_publishable_/);
  });
});

describe("anonymous role · RPC functions behind statuses ④ and ⑤", () => {
  it("is refused EXECUTE on mark_report_forwarded", async () => {
    const r = await rpc("mark_report_forwarded", {
      p_report_id: ABSENT_ID,
      p_destination: "RLS audit probe",
      p_actor: "rls-audit",
      p_note: null,
    });
    // 401/403 = denied outright, 404 = not exposed to this role at all.
    expect([401, 403, 404]).toContain(r.status);
    expect(r.status).not.toBe(200);
    expect(r.status).not.toBe(204);
  });

  it("is refused EXECUTE on record_org_response", async () => {
    const r = await rpc("record_org_response", {
      p_report_id: ABSENT_ID,
      p_org: "RLS audit probe",
      p_response: "probe",
    });
    expect([401, 403, 404]).toContain(r.status);
    expect(r.status).not.toBe(200);
    expect(r.status).not.toBe(204);
  });
});

describe("anonymous role · filing a report pre-marked with a status it did not earn", () => {
  it.each(["forwarded", "org-response", "corroborated"])(
    "cannot insert a report already at status %s",
    async (status) => {
      const r = await insertReport({ status });
      expect(r.status).toBeGreaterThanOrEqual(400);
      expect(r.status).toBeLessThan(500);
    },
  );

  it("cannot insert a report with upvotes it did not receive", async () => {
    const r = await insertReport({ upvotes: 9999 });
    expect(r.status).toBeGreaterThanOrEqual(400);
  });
});

describe("anonymous role · escalating a report that already exists", () => {
  /* This is the vector the RPC grants alone do not cover: PostgREST exposes
     PATCH on every table, so the only thing standing between a visitor and
     reports.status is the absence of an UPDATE policy. RLS denial is
     SILENT — PostgREST answers 2xx having changed nothing — so the
     assertion has to be on the row's state afterwards, never on the
     status code. */
  it("cannot PATCH an existing report's status to forwarded or org-response", async () => {
    const created = await insertReport({});
    expect(created.status, `probe row could not be created: ${created.body}`).toBe(201);
    const row = JSON.parse(created.body)[0] as { id: string; status: string };
    expect(row.status).toBe("submitted");

    // eslint-disable-next-line no-console
    console.log(`[rls-audit] probe row id: ${row.id} — anon cannot delete it; see report`);

    for (const target of ["forwarded", "org-response"]) {
      const patch = await fetch(`${SUPABASE_URL}/rest/v1/reports?id=eq.${row.id}`, {
        method: "PATCH",
        headers: { ...anonHeaders, Prefer: "return=representation" },
        body: JSON.stringify({ status: target }),
      });
      const returned = await patch.text();
      // Whatever the status code, the row must be untouched.
      const after = await fetch(
        `${SUPABASE_URL}/rest/v1/reports?select=status&id=eq.${row.id}`,
        { headers: anonHeaders },
      );
      const [state] = (await after.json()) as Array<{ status: string }>;
      expect(state?.status, `status after PATCH to ${target} (returned: ${returned})`).toBe(
        "submitted",
      );
    }
  });

  it("cannot delete a report to cover its tracks", async () => {
    const listed = await fetch(`${SUPABASE_URL}/rest/v1/reports?select=id&limit=1`, {
      headers: anonHeaders,
    });
    const rows = (await listed.json()) as Array<{ id: string }>;
    if (rows.length === 0) return; // nothing to try against
    await fetch(`${SUPABASE_URL}/rest/v1/reports?id=eq.${rows[0].id}`, {
      method: "DELETE",
      headers: anonHeaders,
    });
    const after = await fetch(
      `${SUPABASE_URL}/rest/v1/reports?select=id&id=eq.${rows[0].id}`,
      { headers: anonHeaders },
    );
    expect(((await after.json()) as unknown[]).length, "row survived the delete attempt").toBe(1);
  });
});

describe("anonymous role · the forwarding log", () => {
  it("is readable, because a transfer log nobody can inspect is not accountability", async () => {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/report_forwardings?select=*&limit=1`, {
      headers: anonHeaders,
    });
    expect(res.status).toBe(200);
  });

  it("cannot be written to directly, which would fake a government handoff", async () => {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/report_forwardings`, {
      method: "POST",
      headers: anonHeaders,
      body: JSON.stringify({
        report_id: ABSENT_ID,
        destination: "RLS audit probe",
        actor: "rls-audit",
      }),
    });
    expect(res.status).toBeGreaterThanOrEqual(400);
  });
});
