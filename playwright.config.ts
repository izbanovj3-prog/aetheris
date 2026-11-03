import { defineConfig, devices } from "@playwright/test";

/* End-to-end tests run against the static export (npm run build → out/),
   served by scripts/serve-static.mjs with the headers from vercel.json.
   The database is never reached: tests stub Supabase with page.route. */

const PORT = 4321;

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 60_000,
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: process.env.E2E_BASE_URL ?? `http://localhost:${PORT}`,
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: `node scripts/serve-static.mjs ${PORT}`,
        url: `http://localhost:${PORT}/`,
        reuseExistingServer: !process.env.CI,
      },
});
