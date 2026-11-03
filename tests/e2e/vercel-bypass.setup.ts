import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { request } from "@playwright/test";
import { BASE_URL, BYPASS_STATE } from "./site";

/* Vercel Deployment Protection, if it is on for previews, answers 401 to
   anyone without a login. Its "Protection Bypass for Automation" secret
   lets CI in: one request with the secret in a header makes Vercel set a
   bypass cookie for this deployment's host, and every test starts with
   that cookie.

   A cookie rather than a header on every request, because a header would
   also be sent to Supabase, Open-Meteo and the map tiles — the secret must
   only ever reach the deployment itself. */

export default async function globalSetup() {
  const secret = process.env.VERCEL_AUTOMATION_BYPASS_SECRET?.trim();
  if (!secret || !process.env.E2E_BASE_URL) return;

  const ctx = await request.newContext();
  let res;
  try {
    res = await ctx.get(BASE_URL, {
      headers: { "x-vercel-protection-bypass": secret, "x-vercel-set-bypass-cookie": "true" },
    });
  } catch (e) {
    // Playwright's error carries a call log that lists the request headers,
    // secret included. Report the failure without it.
    await ctx.dispose();
    const kind = e instanceof Error ? e.name : "Error";
    throw new Error(`Vercel bypass: request to ${BASE_URL} failed (${kind}); details withheld because they include the secret`);
  }
  if (!res.ok()) {
    await ctx.dispose();
    throw new Error(`Vercel bypass: ${BASE_URL} answered ${res.status()} — is the secret current?`);
  }
  mkdirSync(dirname(BYPASS_STATE), { recursive: true });
  await ctx.storageState({ path: BYPASS_STATE });
  await ctx.dispose();
}
