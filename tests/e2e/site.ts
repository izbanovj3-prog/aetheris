/* Where the site under test lives, shared by playwright.config.ts and the
   specs.

   Locally it is scripts/serve-static.mjs on http://localhost:4321. Against
   a deployment (E2E_BASE_URL — a Vercel preview, or production) it is that
   https origin, so "stub everything on https" would stub the site itself.
   Specs stub `offsite` instead: every https request that is not the site. */

export const LOCAL_PORT = 4321;

export const BASE_URL = process.env.E2E_BASE_URL ?? `http://localhost:${LOCAL_PORT}`;

export const SITE_ORIGIN = new URL(BASE_URL).origin;

/** An https request to anywhere but the site under test. */
export const offsite = (url: URL) => url.protocol === "https:" && url.origin !== SITE_ORIGIN;

/** Cookie jar written by vercel-bypass.setup.ts when the deployment is protected. */
export const BYPASS_STATE = ".e2e-state/vercel-bypass.json";
