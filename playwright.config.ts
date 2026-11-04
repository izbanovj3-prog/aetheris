import { defineConfig, devices } from "@playwright/test";
import { BASE_URL, BYPASS_STATE, LOCAL_PORT } from "./tests/e2e/site";

/* End-to-end tests run against the static export (npm run build → out/),
   served by scripts/serve-static.mjs with the headers from vercel.json —
   or, with E2E_BASE_URL set, against a real deployment (a Vercel preview).
   The database is never written to: tests stub Supabase with page.route. */

const DEPLOYED = Boolean(process.env.E2E_BASE_URL);
const BYPASS = DEPLOYED && Boolean(process.env.VERCEL_AUTOMATION_BYPASS_SECRET);

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 60_000,
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  globalSetup: BYPASS ? "./tests/e2e/vercel-bypass.setup.ts" : undefined,
  use: {
    baseURL: BASE_URL,
    // A trace records request headers, so with the bypass cookie it would
    // carry a credential into a downloadable artifact of a public repo.
    trace: BYPASS ? "off" : "retain-on-failure",
    storageState: BYPASS ? BYPASS_STATE : undefined,
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: DEPLOYED
    ? undefined
    : {
        command: `node scripts/serve-static.mjs ${LOCAL_PORT}`,
        url: `http://localhost:${LOCAL_PORT}/`,
        reuseExistingServer: !process.env.CI,
      },
});
