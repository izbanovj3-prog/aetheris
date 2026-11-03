import { expect, test, type Page } from "@playwright/test";
import { communityText } from "../../lib/communityText";
import { offsite } from "./site";

/* A build with no NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY
   (CI job "No-backend build"). The community page must say the shared
   database is not connected, a report must be kept in this browser with a
   message that says so, and no request may go to any Supabase host. */

test.skip(process.env.E2E_NO_BACKEND !== "1", "E2E_NO_BACKEND=1 with a build made without Supabase variables");

test.use({
  geolocation: { latitude: 43.238123, longitude: 76.889456 },
  permissions: ["geolocation"],
});

async function smallJpeg(page: Page) {
  const b64 = await page.evaluate(() => {
    const c = document.createElement("canvas");
    c.width = 320;
    c.height = 240;
    c.getContext("2d")!.fillRect(0, 0, 320, 240);
    return c.toDataURL("image/jpeg", 0.8).split(",")[1];
  });
  return Buffer.from(b64, "base64");
}

for (const [locale, prefix] of [["en", ""], ["ru", "/ru"], ["kk", "/kk"]] as const) {
  const t = communityText(locale);
  test(`no backend: says so, keeps the report here, calls no Supabase (${locale})`, async ({ page }) => {
    const supabase: string[] = [];
    page.on("request", (r) => {
      if (new URL(r.url()).host.endsWith(".supabase.co")) supabase.push(r.url());
    });
    await page.route(offsite, (r) => r.fulfill({ status: 204, body: "" }));

    await page.goto(`${prefix}/community/`);
    await expect(page.getByRole("status").filter({ hasText: t.page.noBackend.slice(0, 40) })).toBeVisible();
    await expect(page.getByText(t.events.noBackend.slice(0, 40))).toBeVisible();

    await page.getByRole("button", { name: t.page.newReport }).click();
    await page.locator("#report-photo").setInputFiles({ name: "p.jpg", mimeType: "image/jpeg", buffer: await smallJpeg(page) });
    await page.getByRole("button", { name: t.flow.cont, exact: true }).click();
    await expect(page.locator("#report-city")).toHaveValue(/.+/);
    await page.getByRole("button", { name: t.flow.cont, exact: true }).click();
    await page.getByRole("button", { name: new RegExp(t.categories.air.label) }).first().click();
    await page.getByRole("button", { name: t.flow.cont, exact: true }).click();
    await page.locator("#report-note").fill("Kept on this device: no backend in this build.");
    await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: t.flow.submit, exact: true }).click();

    await expect(page.getByRole("dialog").getByText(t.confirm.localNoBackend.slice(0, 40))).toBeVisible();
    expect(supabase, "no request may reach a Supabase host").toEqual([]);
  });
}
