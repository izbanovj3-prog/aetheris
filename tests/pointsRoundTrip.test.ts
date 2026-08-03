import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { computePoints } from "@/lib/points";

/* ─────────────────────────────────────────────────────────────
   Points after you have gone away and come back.

   The corroboration bonus is awarded by a Postgres trigger, which can
   fire long after the person who filed the report has closed the tab —
   somebody else reports the same thing the next morning. Nothing pushes
   that to the browser. The only reason the 25 points ever appear is that
   the next page load re-reads the rows from Postgres and recomputes from
   their CURRENT status, and that a row written by this device still comes
   back marked as this device's.

   Both halves are asserted here, against the real module, with fetch and
   localStorage stubbed — because if either broke, points would simply be
   quietly lower than the platform says they are, on a screen nobody can
   check against anything.
   ───────────────────────────────────────────────────────────── */

const DEVICE = "device-under-test-0001";

let store: Record<string, string>;

beforeEach(() => {
  store = { "aetheris.community.anon.v1": DEVICE };
  vi.stubGlobal("window", {
    localStorage: {
      getItem: (k: string) => store[k] ?? null,
      setItem: (k: string, v: string) => {
        store[k] = v;
      },
      removeItem: (k: string) => {
        delete store[k];
      },
    },
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
});

/** One PostgREST row, as the API would hand it back. */
function row(over: Record<string, unknown> = {}) {
  return {
    id: "11111111-2222-3333-4444-555555555555",
    created_at: new Date().toISOString(),
    anon_id: DEVICE,
    author: "Anonymous",
    city: "Almaty",
    lat: 43.238,
    lon: 76.889,
    category: "air",
    severity: "low",
    title: "filed yesterday",
    body: "b",
    status: "submitted",
    upvotes: 0,
    photo_quality: false,
    parent_id: null,
    ...over,
  };
}

function stubList(rows: unknown[]) {
  vi.stubGlobal("fetch", () =>
    Promise.resolve({ ok: true, json: () => Promise.resolve(rows) } as Response),
  );
}

describe("a report corroborated while you were away", () => {
  it("is recognised as yours on the next visit", async () => {
    stubList([row({ status: "corroborated" })]);
    const { getRemoteReports } = await import("@/lib/reports");
    const mine = (await getRemoteReports())!;
    expect(mine).toHaveLength(1);
    expect(mine[0].userCreated, "row written by this device came back unowned").toBe(true);
  });

  /* 10 for filing + 25 for the corroboration that happened after the tab
     was closed. If the status were read from a stale local copy instead
     of the row, this would still be 10. */
  it("pays the corroboration bonus on the next visit", async () => {
    stubList([row({ status: "corroborated" })]);
    const { getRemoteReports } = await import("@/lib/reports");
    const points = computePoints((await getRemoteReports())!.filter((r) => r.userCreated));
    expect(points.total).toBe(35);
    expect(points.corroboration).toBe(25);
  });

  it("does not pay it to a different device", async () => {
    stubList([row({ status: "corroborated", anon_id: "somebody-elses-device" })]);
    const { getRemoteReports } = await import("@/lib/reports");
    const mine = (await getRemoteReports())!.filter((r) => r.userCreated);
    expect(mine).toHaveLength(0);
    expect(computePoints(mine).total).toBe(0);
  });

  it("keeps the bonus once the report moves on to forwarded", async () => {
    stubList([row({ status: "forwarded" })]);
    const { getRemoteReports } = await import("@/lib/reports");
    const points = computePoints((await getRemoteReports())!.filter((r) => r.userCreated));
    expect(points.total).toBe(35);
  });

  it("counts the stored bonuses too, when the row carries them", async () => {
    stubList([row({ status: "corroborated", photo_quality: true, parent_id: "an-earlier-report" })]);
    const { getRemoteReports } = await import("@/lib/reports");
    const points = computePoints((await getRemoteReports())!.filter((r) => r.userCreated));
    // 10 filed + 25 corroborated + 5 photo + 15 follow-up
    expect(points.total).toBe(55);
  });

  it("reports the datastore being down as null, not as zero reports", async () => {
    vi.stubGlobal("fetch", () => Promise.reject(new Error("offline")));
    const { getRemoteReports } = await import("@/lib/reports");
    expect(await getRemoteReports()).toBeNull();
  });
});
