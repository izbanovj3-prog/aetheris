import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/* ─────────────────────────────────────────────────────────────
   What the browser sends and asks for, after privacy-hardening.sql.

   The database enforces all of this on its own (tests/schema.test.ts).
   These tests pin the other side: that the precise point and a free-text
   author never leave the device, that no read asks for device ids, and
   that RSVP withdrawal no longer issues a table-wide DELETE.
   ───────────────────────────────────────────────────────────── */

type Call = { url: string; init?: RequestInit };
let calls: Call[];
let store: Record<string, string>;

function respondWith(handler: (url: string, init?: RequestInit) => unknown, status = 200) {
  vi.stubGlobal("fetch", (url: string, init?: RequestInit) => {
    calls.push({ url, init });
    const body = handler(url, init);
    return Promise.resolve({
      ok: status < 300,
      status,
      json: () => Promise.resolve(body),
      text: () => Promise.resolve(JSON.stringify(body)),
    } as Response);
  });
}

beforeEach(() => {
  calls = [];
  store = { "aetheris.community.anon.v1": "legacy-public-device-id" };
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

describe("coarsen", () => {
  it("rounds to two decimals (~1 km)", async () => {
    const { coarsen } = await import("@/lib/supabase");
    expect(coarsen(43.238123)).toBe(43.24);
    expect(coarsen(76.884999)).toBe(76.88);
    expect(coarsen(null)).toBeNull();
    expect(coarsen(undefined)).toBeNull();
    expect(coarsen(Number.NaN)).toBeNull();
  });
});

describe("the device id", () => {
  it("is a fresh v2 id, and the once-public v1 id is dropped", async () => {
    const { anonId, isV2Id } = await import("@/lib/reports");
    const id = anonId();
    expect(isV2Id(id)).toBe(true);
    expect(id).not.toContain("legacy-public-device-id");
    expect(store["aetheris.community.anon.v1"]).toBeUndefined();
    expect(anonId()).toBe(id);
  });
});

describe("filing a report", () => {
  it("sends coarse coordinates, no author, and asks for no device id back", async () => {
    respondWith((_url, init) => {
      const sent = JSON.parse(String(init?.body));
      return [{ ...sent, id: "row-1", created_at: new Date().toISOString(), status: "submitted", upvotes: 0 }];
    }, 201);
    const { createReport } = await import("@/lib/reports");
    await createReport({
      category: "air",
      severity: "low",
      title: "Smoke over the river",
      body: "Thick smoke since the morning.",
      city: "Almaty",
      lat: 43.238123,
      lon: 76.889456,
    });

    expect(calls).toHaveLength(1);
    const sent = JSON.parse(String(calls[0].init?.body));
    expect(sent.lat).toBe(43.24);
    expect(sent.lon).toBe(76.89);
    expect(sent).not.toHaveProperty("author");
    expect(sent).not.toHaveProperty("status");
    expect(sent.anon_id).toMatch(/^v2-/);
    expect(calls[0].url).toContain("select=");
    expect(calls[0].url).not.toMatch(/anon_id/);
  });

  it("keeps the precise point off the device's own mirror too", async () => {
    respondWith(() => [], 503); // backend down → local-only copy
    const { createReport } = await import("@/lib/reports");
    const r = await createReport({
      category: "water",
      severity: "low",
      title: "Oil sheen",
      body: "Rainbow film along the bank.",
      city: "Atyrau",
      lat: 47.094321,
      lon: 51.923456,
    });
    expect(r.lat).toBe(47.09);
    expect(r.lon).toBe(51.92);
  });
});

describe("reading", () => {
  it("never asks for every column or for anon_id", async () => {
    respondWith(() => []);
    const { listRemoteReports } = await import("@/lib/supabase");
    await listRemoteReports(5);
    expect(calls[0].url).not.toContain("select=*");
    expect(calls[0].url).not.toMatch(/anon_id/);
  });

  it("builds community signals from counts only", async () => {
    respondWith(() => [
      { city: "Almaty", category: "air", severity: "high", reports: 3, latest: "2026-11-01T10:00:00Z", city_reporters: 2 },
      { city: "Almaty", category: "waste", severity: "low", reports: 1, latest: "2026-11-02T10:00:00Z", city_reporters: 2 },
    ]);
    const { fetchCommunitySignals } = await import("@/lib/community");
    const s = (await fetchCommunitySignals())!;
    expect(calls[0].url).toContain("/rpc/community_city_signals");
    expect(s.Almaty.total).toBe(4);
    expect(s.Almaty.reporters).toBe(2);
    expect(s.Almaty.byCategory.air).toBe(3);
    expect(s.Almaty.latest).toBe(new Date("2026-11-02T10:00:00Z").getTime());
  });
});

describe("events", () => {
  it("withdraws an RSVP through the function, never a table DELETE", async () => {
    respondWith(() => null, 204);
    const { setRsvp } = await import("@/lib/events");
    await setRsvp("00000000-0000-0000-0000-0000000000aa", false);
    expect(calls).toHaveLength(1);
    expect(calls[0].url).toContain("/rpc/withdraw_rsvp");
    expect(calls[0].init?.method).toBe("POST");
  });

  it("falls back to the old path only when the function does not exist", async () => {
    let n = 0;
    vi.stubGlobal("fetch", (url: string, init?: RequestInit) => {
      calls.push({ url, init });
      n += 1;
      const status = n === 1 ? 404 : 204;
      return Promise.resolve({ ok: status < 300, status, json: () => Promise.resolve(null) } as Response);
    });
    const { setRsvp } = await import("@/lib/events");
    await setRsvp("00000000-0000-0000-0000-0000000000aa", false);
    expect(calls).toHaveLength(2);
    expect(calls[1].init?.method).toBe("DELETE");
    expect(calls[1].url).toMatch(/anon_id=eq\.v2-/);
  });

  it("does not send the check-in position anywhere but the fence function", async () => {
    respondWith(() => null, 204);
    const { checkIn } = await import("@/lib/events");
    await checkIn("00000000-0000-0000-0000-0000000000aa", 43.2385, 76.8895);
    expect(calls).toHaveLength(1);
    expect(calls[0].url).toContain("/rpc/check_in_event");
  });

  it("takes a fresh device id when the database says the current one is burned", async () => {
    respondWith(() => ({ message: "device_id_invalid: reload the page and try again" }), 400);
    const { setRsvp } = await import("@/lib/events");
    const { anonId } = await import("@/lib/reports");
    const before = anonId();
    await expect(setRsvp("00000000-0000-0000-0000-0000000000aa", true)).rejects.toThrow();
    const after = anonId();
    expect(after).toMatch(/^v2-/);
    expect(after).not.toBe(before);
  });
});

describe("a report the database declines", () => {
  const input = {
    category: "air" as const,
    severity: "low" as const,
    title: "Smoke over the river",
    body: "Thick smoke since the morning.",
    city: "Almaty",
    lat: 43.238123,
    lon: 76.889456,
  };

  it("is reported as refused, and nothing is kept on the device", async () => {
    respondWith(() => ({ code: "P0001", message: "outside_coverage: the pin is outside Kazakhstan" }), 400);
    const { createReport, ReportRefusedError } = await import("@/lib/reports");
    await expect(createReport(input)).rejects.toBeInstanceOf(ReportRefusedError);
    expect(store["aetheris.community.reports.v1"]).toBeUndefined();
  });

  it("still falls back to the device when the server is down", async () => {
    respondWith(() => ({ message: "upstream error" }), 503);
    const { createReport } = await import("@/lib/reports");
    const report = await createReport(input);
    expect(report.remote).toBeFalsy();
    expect(store["aetheris.community.reports.v1"]).toBeDefined();
  });
});
