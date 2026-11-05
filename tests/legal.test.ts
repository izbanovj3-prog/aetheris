import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { getLegal } from "@/lib/legal";
import { LOCALES } from "@/lib/i18n";
import { ROUTES } from "@/lib/site";
import { COORD_DECIMALS } from "@/lib/supabase";

/* The privacy policy makes claims about what the code does. These tests
   tie the claims that have a number in them to the code that sets the
   number, so changing one without the other fails here. */

const SQL = readFileSync(join(process.cwd(), "supabase", "privacy-hardening.sql"), "utf8");

describe("legal drafts", () => {
  it.each(LOCALES)("exist in %s with the same structure as English", (l) => {
    const en = getLegal("en");
    const d = getLegal(l);
    expect(d.privacy.sections).toHaveLength(en.privacy.sections.length);
    expect(d.terms.sections).toHaveLength(en.terms.sections.length);
  });

  it.each(LOCALES)("say plainly in %s that they are drafts under legal review", (l) => {
    const marker = { en: /legal review/i, ru: /юридической вычитке/i, kk: /заңгерлік тексеру/i }[l];
    for (const doc of [getLegal(l).privacy, getLegal(l).terms]) {
      expect(doc.draftBanner).toMatch(marker);
      expect(doc.metaTitle).toMatch(/draft|черновик|жоба/i);
    }
  });

  it("promises ~1 km, which is what the client and the database round to", () => {
    expect(COORD_DECIMALS).toBe(2);
    expect(SQL).toMatch(/round\(new\.lat::numeric, 2\)/);
    for (const l of LOCALES) {
      expect(JSON.stringify(getLegal(l).privacy)).toMatch(/1 км|1 km|1 км-ге/);
    }
  });

  it("promises 24-hour retention of network hashes, which is what the SQL deletes", () => {
    expect(SQL).toMatch(/created_at < now\(\) - interval '24 hours'/);
    for (const l of LOCALES) {
      expect(JSON.stringify(getLegal(l).privacy)).toMatch(/24/);
    }
  });

  it("are routed and reachable in every locale", () => {
    expect(ROUTES).toContain("/privacy");
    expect(ROUTES).toContain("/terms");
    for (const doc of ["privacy", "terms"]) {
      // English lives in the (en) route group: same URL, its own root layout.
      expect(existsSync(join(process.cwd(), "app", "(en)", doc, "page.tsx"))).toBe(true);
      for (const l of ["ru", "kk"]) {
        expect(existsSync(join(process.cwd(), "app", l, doc, "page.tsx"))).toBe(true);
      }
    }
  });
});
