import { afterEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";

/* lib/supabase.ts takes the project from the build environment only.
   Without NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY the
   site runs with no backend: nothing may be sent anywhere. */

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.resetModules();
});

async function withEnv(url: string, key: string) {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", url);
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", key);
  vi.resetModules();
  return import("@/lib/supabase");
}

describe("the Supabase project", () => {
  it("is not built into the source", () => {
    const src = readFileSync("lib/supabase.ts", "utf8");
    expect(src).not.toMatch(/[a-z0-9]{20}\.supabase\.co/);
    expect(src).not.toMatch(/sb_(publishable|secret)_[A-Za-z0-9_-]{8,}/);
  });

  it("comes from NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY", async () => {
    const m = await withEnv("https://example-ref.supabase.co/", "sb_publishable_x");
    expect(m.SUPABASE_URL).toBe("https://example-ref.supabase.co");
    expect(m.SUPABASE_KEY).toBe("sb_publishable_x");
    expect(m.isConfigured()).toBe(true);
  });

  it("is off when either variable is missing, or the URL is not https", async () => {
    expect((await withEnv("", "sb_publishable_x")).isConfigured()).toBe(false);
    expect((await withEnv("https://example-ref.supabase.co", "")).isConfigured()).toBe(false);
    expect((await withEnv("http://example-ref.supabase.co", "sb_publishable_x")).isConfigured()).toBe(false);
  });
});

describe("with no backend", () => {
  it("sends nothing anywhere, from any entry point", async () => {
    const fetchSpy = vi.fn(() => Promise.reject(new Error("no request expected")));
    vi.stubGlobal("fetch", fetchSpy);
    vi.stubGlobal("window", {
      localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
    });
    const m = await withEnv("", "");

    expect(await m.listRemoteReports()).toBeNull();
    expect(await m.insertRemoteReport({} as never)).toEqual({ ok: false, reason: "unavailable" });
    expect(await m.deleteRemoteReport("00000000-0000-0000-0000-000000000000", "v2-x")).toBe("unavailable");
    expect((await m.callRpc("delete_my_report", {}))?.status).toBe(503);

    const { createReport } = await import("@/lib/reports");
    const r = await createReport({
      category: "air",
      severity: "low",
      title: "Smoke over the river",
      body: "Thick smoke since the morning.",
      city: "Almaty",
      lat: 43.238,
      lon: 76.889,
    });
    expect(r.remote).toBeFalsy();
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
