import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

/* ─────────────────────────────────────────────────────────────
   AETHERIS · test configuration

   Scope, stated up front: these are unit tests over the pure logic —
   scoring, ranks, badges, status mapping, the sitemap, and the copy rules
   the platform has committed to. They deliberately do not touch React
   components, MapLibre or the network.

   That is not because the rest does not matter. It is because everything
   here runs in milliseconds with no browser and no fixtures, so it can be
   run on every change, and because this is the layer where a regression
   is silent — a wrong point total or a status quietly reading "verified"
   looks fine on screen. Browser-level checks (the submission flow, the
   320px horizontal scroll) need Playwright and are the obvious next step;
   see README.
   ───────────────────────────────────────────────────────────── */

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
});
