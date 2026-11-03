import { expect, test, type Page } from "@playwright/test";
import { communityText } from "../../lib/communityText";
import { offsite } from "./site";

/* The resident scenario against a REAL database — the separate TEST
   Supabase project, never production: consent → submit → the row exists →
   delete it from the page → the row is gone.

   Runs only when E2E_LIVE_SUPABASE_URL / E2E_LIVE_SUPABASE_KEY are set, and
   only against a build made with those same values as
   NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_KEY (CI job "Live report
   flow"). Any request to a Supabase host other than that test project is
   blocked and fails the test, so a build pointed at production cannot
   write there even by mistake. */

const LIVE_URL = process.env.E2E_LIVE_SUPABASE_URL?.trim().replace(/\/$/, "");
const LIVE_KEY = process.env.E2E_LIVE_SUPABASE_KEY?.trim();
const LIVE_HOST = LIVE_URL ? new URL(LIVE_URL).host : "";
const PRODUCTION_HOST = "effxsftaolpjjlpuqwax.supabase.co";

test.skip(!LIVE_URL || !LIVE_KEY, "E2E_LIVE_SUPABASE_URL / E2E_LIVE_SUPABASE_KEY not set");

test.use({
  geolocation: { latitude: 43.238123, longitude: 76.889456 },
  permissions: ["geolocation"],
});

async function rowCount(id: string) {
  const res = await fetch(`${LIVE_URL}/rest/v1/reports?select=id&id=eq.${id}`, {
    headers: { apikey: LIVE_KEY!, Authorization: `Bearer ${LIVE_KEY}` },
  });
  expect(res.status).toBe(200);
  return ((await res.json()) as unknown[]).length;
}

/** Only the test project may be reached; everything else off-site is cut. */
async function guardNetwork(page: Page, foreign: string[], seen: { live: boolean }) {
  await page.route(offsite, (route) => {
    const host = new URL(route.request().url()).host;
    if (host === LIVE_HOST) {
      seen.live = true;
      return route.continue();
    }
    if (host.endsWith(".supabase.co")) {
      foreign.push(host);
      return route.abort();
    }
    return route.fulfill({ status: 204, body: "" });
  });
}

async function smallJpeg(page: Page) {
  const b64 = await page.evaluate(() => {
    const c = document.createElement("canvas");
    c.width = 640;
    c.height = 480;
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = "#567";
    ctx.fillRect(0, 0, 640, 480);
    return c.toDataURL("image/jpeg", 0.8).split(",")[1];
  });
  return Buffer.from(b64, "base64");
}

test.beforeAll(() => {
  expect(LIVE_HOST, "the live flow must never target production").not.toBe(PRODUCTION_HOST);
});

for (const [locale, prefix] of [["en", ""], ["ru", "/ru"], ["kk", "/kk"]] as const) {
  const t = communityText(locale);
  test(`live test database: submit, then delete own report (${locale})`, async ({ page }) => {
    const foreign: string[] = [];
    const seen = { live: false };
    await guardNetwork(page, foreign, seen);
    page.on("dialog", (d) => d.accept());

    await page.goto(`${prefix}/community/`);
    // The page loads its feed on arrival: that first request shows which
    // project this build talks to. Stop here unless it is the test one.
    await expect
      .poll(() => (foreign.length ? `blocked: ${foreign[0]}` : seen.live ? "test project" : "waiting"), {
        message: "this build must talk to the test Supabase project only",
        timeout: 20_000,
      })
      .toBe("test project");
    await page.getByRole("button", { name: t.page.newReport }).click();

    await page.locator("#report-photo").setInputFiles({
      name: "camera.jpg",
      mimeType: "image/jpeg",
      buffer: await smallJpeg(page),
    });
    await expect(page.getByRole("img", { name: t.flow.photoPreviewAlt })).toBeVisible();
    await page.getByRole("button", { name: t.flow.cont, exact: true }).click();

    await expect(page.locator("#report-city")).toHaveValue(/.+/);
    await page.getByRole("button", { name: t.flow.cont, exact: true }).click();

    await page.getByRole("button", { name: new RegExp(t.categories.air.label) }).first().click();
    await page.getByRole("button", { name: t.flow.cont, exact: true }).click();

    await page.locator("#report-note").fill(`Automated test report (${locale}); deleted by the same test.`);
    const submit = page.getByRole("button", { name: t.flow.submit, exact: true });
    await expect(submit, "submit must wait for consent").toBeDisabled();
    await page.getByRole("checkbox").check();

    const inserted = page.waitForResponse(
      (r) => r.request().method() === "POST" && new URL(r.url()).host === LIVE_HOST && r.url().includes("/rest/v1/reports"),
    );
    await submit.click();
    const res = await inserted;
    expect(res.status(), await res.text()).toBe(201);
    const [row] = (await res.json()) as Array<{ id: string; lat: number; lon: number }>;
    expect(row.id).toBeTruthy();
    // Stored coarsened to ~1 km. The client rounds before sending, so this
    // holds with or without migration 7; the database's own rounding is
    // checked by tests/security.rls.test.ts with an unrounded insert.
    expect(row.lat).toBe(43.24);
    expect(row.lon).toBe(76.89);

    await expect(page.getByText(t.confirm.stored.slice(0, 40))).toBeVisible();
    expect(await rowCount(row.id), "row is in the test database").toBe(1);

    await page.getByRole("dialog").getByRole("button", { name: t.flow.close, exact: true }).click();
    const del = page.getByRole("button", { name: t.card.delete, exact: true }).first();
    await expect(del).toBeVisible();
    await del.click();
    await expect(page.getByText(t.page.toastDeleted)).toBeVisible();
    expect(await rowCount(row.id), "row is gone from the test database").toBe(0);

    expect(foreign, "requests to a Supabase project other than the test one").toEqual([]);
  });
}
