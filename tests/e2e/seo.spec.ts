import { expect, test } from "@playwright/test";
import { offsite } from "./site";

/* Search and sharing metadata on every language tree. */
const PAGES: Array<[string, "en" | "ru" | "kk"]> = [
  ["/", "en"],
  ["/ru/", "ru"],
  ["/kk/", "kk"],
  ["/community/", "en"],
  ["/ru/community/", "ru"],
  ["/kk/community/", "kk"],
  ["/ru/map/", "ru"],
  ["/kk/privacy/", "kk"],
  ["/city/almaty/", "en"],
  ["/ru/city/almaty/", "ru"],
];

test.beforeEach(async ({ page }) => {
  await page.route(offsite, (r) => r.fulfill({ status: 204, body: "" }));
});

for (const [path, lang] of PAGES) {
  test(`${path} · lang, canonical, hreflang, description, preview`, async ({ page }) => {
    await page.goto(path, { waitUntil: "domcontentloaded" });
    expect(await page.locator("html").getAttribute("lang")).toBe(lang);

    const canonical = await page.locator('link[rel="canonical"]').getAttribute("href");
    expect(canonical).toBe(`https://aetherisearth.live${path}`);

    const alternates = await page.locator('link[rel="alternate"][hreflang]').evaluateAll((els) =>
      els.map((e) => e.getAttribute("hreflang")),
    );
    expect(new Set(alternates)).toEqual(new Set(["en", "ru", "kk", "x-default"]));

    const desc = await page.locator('meta[name="description"]').getAttribute("content");
    expect((desc ?? "").length).toBeGreaterThan(40);

    const og = await page.locator('meta[property="og:image"]').first().getAttribute("content");
    if (lang !== "en" && !path.includes("/city/")) expect(og).toContain(`/${lang}/opengraph-image`);
    expect(await page.locator('meta[name="twitter:card"]').getAttribute("content")).toBe("summary_large_image");
  });
}

test("robots.txt points at the sitemap, and the sitemap lists all three trees", async ({ request }) => {
  const robots = await (await request.get("/robots.txt")).text();
  expect(robots).toMatch(/Sitemap: https:\/\/aetherisearth\.live\/sitemap\.xml/);
  const sitemap = await (await request.get("/sitemap.xml")).text();
  for (const u of ["/community/", "/ru/community/", "/kk/community/", "/kk/privacy/", "/ru/terms/"]) {
    expect(sitemap).toContain(`https://aetherisearth.live${u}`);
  }
});

test("structured data parses and makes no claim about being a monitoring service", async ({ page }) => {
  await page.goto("/");
  const raw = await page.locator('script[type="application/ld+json"]').first().textContent();
  const data = JSON.parse(raw ?? "{}");
  expect(data["@graph"]).toBeTruthy();
  expect(raw).not.toMatch(/real-time|monitoring/i);
});

test("the head script still applies saved text size and theme before paint", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("aeth-text", "3");
    localStorage.setItem("aeth-theme", "light");
  });
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/kk/", { waitUntil: "domcontentloaded" });
  const html = page.locator("html");
  await expect(html).toHaveAttribute("data-text", "3");
  await expect(html).toHaveAttribute("data-theme", "light");
  await expect(html).toHaveAttribute("lang", "kk");
  expect(errors).toEqual([]);
});
