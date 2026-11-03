import { expect, test, type Response } from "@playwright/test";
import { offsite } from "./site";

/* Map labels are drawn from self-hosted SDF glyphs
   (/fonts/noto/{range}.pbf, components/map/EnvironmentalMap.tsx). A range
   that is missing makes MapLibre leave those letters blank: on /ru/map/ the
   Cyrillic range 1024-1279 was a 404 on a real preview, so city names had
   no visible text. Each locale must get every range it asks for. */

const CASES = [
  { path: "/map/", needs: "0-255" },
  { path: "/ru/map/", needs: "1024-1279" },
  { path: "/kk/map/", needs: "1024-1279" },
] as const;

for (const { path, needs } of CASES) {
  test(`${path} · label glyphs load (${needs}), none missing`, async ({ page }) => {
    await page.route(offsite, (r) => r.fulfill({ status: 204, body: "" }));
    const glyphs: Response[] = [];
    page.on("response", (r) => {
      if (r.url().includes("/fonts/")) glyphs.push(r);
    });

    const wanted = page.waitForResponse((r) => r.url().endsWith(`/fonts/noto/${needs}.pbf`), {
      timeout: 45_000,
    });
    await page.goto(path, { waitUntil: "load" });
    const res = await wanted;
    expect(res.status(), `${needs}.pbf`).toBe(200);
    expect((await res.body()).length, `${needs}.pbf is empty`).toBeGreaterThan(1000);

    // Let any other ranges the labels need arrive, then: none may be missing.
    await page.waitForTimeout(1500);
    const failed = glyphs.filter((r) => r.status() >= 400).map((r) => `${r.status()} ${new URL(r.url()).pathname}`);
    expect(failed).toEqual([]);
  });
}
