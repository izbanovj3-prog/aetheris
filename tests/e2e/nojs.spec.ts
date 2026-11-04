import { expect, test } from "@playwright/test";

/* With JavaScript off the site still says what it is: every key page shows
   its heading and its text (the map page shows what the atlas is, since
   the map itself needs JavaScript). */
test.use({ javaScriptEnabled: false });

for (const path of ["/", "/ru/", "/kk/community/", "/map/", "/methodology/", "/privacy/", "/ru/terms/", "/city/almaty/"]) {
  test(`${path} is readable without JavaScript`, async ({ page }) => {
    await page.goto(path);
    const h1 = page.locator("h1").first();
    await expect(h1).toBeVisible();
    expect(((await h1.textContent()) ?? "").trim().length).toBeGreaterThan(3);
    const opacity = await h1.evaluate((el) => {
      let o = 1;
      for (let e: Element | null = el; e; e = e.parentElement) o *= Number(getComputedStyle(e).opacity);
      return o;
    });
    expect(opacity, "heading is rendered but invisible").toBeGreaterThan(0.9);
    const text = await page.locator("main").innerText();
    expect(text.length).toBeGreaterThan(150);
  });
}
