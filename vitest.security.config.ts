import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

/* Runs only the access-control audit, which talks to the live database.
   Separate from vitest.config.ts so `npm test` stays offline and fast —
   see the header of tests/security.rls.test.ts for what it asserts and
   what it deliberately cannot. */

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./", import.meta.url)) },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.rls.test.ts"],
    testTimeout: 30_000,
  },
});
