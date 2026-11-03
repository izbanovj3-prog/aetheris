import { expect, test } from "@playwright/test";
import { getDict } from "../../lib/i18n";

/* The 404 page answers with status 404 and speaks the language of the
   address that was not found. */
for (const [locale, path] of [["en", "/no-such-page/"], ["ru", "/ru/no-such-page/"], ["kk", "/kk/no-such-page/"]] as const) {
  test(`404 in ${locale}`, async ({ page }) => {
    await page.route(/^https:\/\//, (r) => r.fulfill({ status: 204, body: "" }));
    const res = await page.goto(path);
    expect(res?.status()).toBe(404);
    const e = getDict(locale).errors;
    await expect(page.getByRole("heading", { level: 1, name: e.nfTitle })).toBeVisible();
    await expect(page.getByRole("link", { name: e.home })).toHaveAttribute("href", locale === "en" ? "/" : `/${locale}/`);
  });
}
