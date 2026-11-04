import { expect, test } from "@playwright/test";
import { offsite } from "./site";

/* The globe is decoration and the heaviest download on the site. Under
   prefers-reduced-motion it must not load at all — neither the land
   polygons nor three.js — and a static stand-in takes its place. */
test.describe("globe under prefers-reduced-motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("is never downloaded", async ({ page }) => {
    const fetched: string[] = [];
    page.on("request", (r) => fetched.push(r.url()));
    await page.route(offsite, (r) => r.fulfill({ status: 204, body: "" }));
    await page.goto("/", { waitUntil: "load" });
    await page.waitForTimeout(4000);
    expect(fetched.filter((u) => u.includes("/data/land.json"))).toEqual([]);
    await expect(page.locator('[data-globe="static"]')).toHaveCount(1);
  });
});
