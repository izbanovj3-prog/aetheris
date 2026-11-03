import { expect, test } from "@playwright/test";
import { offsite } from "./site";

/* Security headers are present, and the Content-Security-Policy breaks
   nothing: on every key route there is no CSP violation and no console
   error from the site's own code.

   Locally (scripts/serve-static.mjs) the headers come from vercel.json;
   against a preview (E2E_BASE_URL) they come from Vercel itself, so the
   same test checks the real deployment. Off-site requests are stubbed
   locally because the sandbox has no network; a request the CSP blocks
   never reaches the stub, so violations are still caught. */

const ROUTES = [
  "/",
  "/map/",
  "/dashboard/",
  "/assistant/",
  "/community/",
  "/city/almaty/",
  "/methodology/",
  "/privacy/",
  "/terms/",
  "/ru/",
  "/ru/map/",
  "/ru/community/",
  "/ru/privacy/",
  "/ru/terms/",
  "/kk/",
  "/kk/dashboard/",
  "/kk/community/",
  "/kk/privacy/",
  "/kk/terms/",
];

const REQUIRED_HEADERS = [
  "content-security-policy",
  "strict-transport-security",
  "x-content-type-options",
  "referrer-policy",
  "permissions-policy",
  "x-frame-options",
];

const LOCAL = !process.env.E2E_BASE_URL;

for (const route of ROUTES) {
  test(`${route} · headers present, no CSP violation, no console error`, async ({ page }) => {
    const problems: string[] = [];

    await page.addInitScript(() => {
      document.addEventListener("securitypolicyviolation", (e) => {
        console.error(`CSP-VIOLATION ${e.violatedDirective} ${e.blockedURI}`);
      });
    });
    page.on("console", (m) => {
      if (m.type() !== "error") return;
      const text = m.text();
      // Locally, stubbed off-site resources can fail to decode; that is the
      // stub, not the site. Never ignored against a real deployment.
      if (LOCAL && /Failed to load resource|ERR_|AJAXError|Could not load image/i.test(text) && !/CSP/.test(text)) return;
      problems.push(text);
    });
    page.on("pageerror", (e) => problems.push(`pageerror: ${e.message}`));

    if (LOCAL) {
      await page.route(offsite, (r) => {
        const url = r.request().url();
        if (url.includes("supabase.co")) return r.fulfill({ status: 200, contentType: "application/json", body: "[]" });
        return r.fulfill({ status: 204, body: "" });
      });
    }

    const res = await page.goto(route, { waitUntil: "load" });
    expect(res?.status(), `${route} status`).toBe(200);
    const headers = res!.headers();
    for (const h of REQUIRED_HEADERS) expect(headers[h], `${route} missing ${h}`).toBeTruthy();
    expect(headers["content-security-policy"]).toContain("frame-ancestors 'none'");
    expect(headers["content-security-policy"]).not.toContain("unsafe-eval");
    expect(headers["permissions-policy"]).toContain("camera=()");

    // Let lazy chunks, workers and the globe/map initialise.
    await page.waitForTimeout(2500);
    expect(problems, problems.join("\n")).toEqual([]);
  });
}
