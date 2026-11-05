import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { expect, test } from "@playwright/test";

/* The language of every page as the server sends it — before any script.
   Each tree has its own root layout (app/(en), app/ru, app/kk), so the
   static HTML itself must say lang="ru" on /ru/… and lang="kk" on /kk/…,
   with the matching og:locale and the other two as og:locale:alternate.
   The head script that sets lang from the URL is only a fallback, so this
   reads raw HTML, never the page after JavaScript has run.

   Locally: every .html file in out/. Against a deployment (E2E_BASE_URL):
   a sample of pages, fetched without running them. */

const OG = { en: "en_US", ru: "ru_RU", kk: "kk_KZ" } as const;
type Lang = keyof typeof OG;

const DEPLOYED = Boolean(process.env.E2E_BASE_URL);
const OUT = join(process.cwd(), "out");

function htmlFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) return htmlFiles(p);
    return name.endsWith(".html") ? [p] : [];
  });
}

/** URL path of an exported file: out/ru/map/index.html → /ru/map/. */
function urlPath(file: string): string {
  const rel = relative(OUT, file).split(sep).join("/");
  return "/" + rel.replace(/(^|\/)index\.html$/, "$1").replace(/\.html$/, "");
}

const isNotFound = (path: string) => path === "/404" || path === "/404/" || path.startsWith("/_not-found");
const expectedLang = (path: string): Lang => (path.startsWith("/ru/") ? "ru" : path.startsWith("/kk/") ? "kk" : "en");

function check(path: string, html: string) {
  const lang = /<html[^>]*\slang="([^"]+)"/.exec(html)?.[1];
  // The one 404.html answers for every tree; its prerender is English and
  // the head script switches it by address.
  const want: Lang = isNotFound(path) ? "en" : expectedLang(path);
  expect(lang, `${path}: <html lang>`).toBe(want);

  const og = [...html.matchAll(/<meta property="og:locale" content="([^"]+)"/g)].map((m) => m[1]);
  expect(og, `${path}: og:locale`).toEqual([OG[want]]);
  const alt = [...html.matchAll(/<meta property="og:locale:alternate" content="([^"]+)"/g)].map((m) => m[1]);
  expect(new Set(alt), `${path}: og:locale:alternate`).toEqual(
    new Set((Object.keys(OG) as Lang[]).filter((l) => l !== want).map((l) => OG[l])),
  );

  // Moving to three root layouts must not cost a page its canonical or
  // hreflang set. Pages marked noindex (the 404) have neither on purpose.
  if (!/<meta name="robots" content="noindex/.test(html)) {
    const canonical = /<link rel="canonical" href="([^"]+)"/.exec(html)?.[1] ?? "";
    expect(new URL(canonical).pathname, `${path}: canonical`).toBe(path);
  }
}

if (!DEPLOYED) {
  test("every exported page: lang and og:locale match its language tree", () => {
    test.skip(!existsSync(OUT), "no out/ — run npm run build first");
    const files = htmlFiles(OUT);
    const seen: Record<Lang, number> = { en: 0, ru: 0, kk: 0 };
    for (const f of files) {
      const path = urlPath(f);
      const html = readFileSync(f, "utf8");
      check(path, html);
      // Each tree's preview card resolves to a file that was exported.
      const img = /<meta property="og:image" content="([^"]+)"/.exec(html)?.[1];
      expect(img, `${path}: og:image`).toBeTruthy();
      const file = join(OUT, decodeURIComponent(new URL(img!).pathname));
      expect(existsSync(file), `${path}: og:image ${img} → ${file}`).toBe(true);
      if (!isNotFound(path)) seen[expectedLang(path)]++;
    }
    // A tree that silently dropped out of the export would pass the loop.
    for (const l of Object.keys(seen) as Lang[]) expect(seen[l], `${l} pages`).toBeGreaterThan(20);
  });
} else {
  for (const path of ["/", "/community/", "/ru/", "/ru/community/", "/ru/city/almaty/", "/kk/", "/kk/privacy/", "/kk/map/"]) {
    test(`${path}: lang and og:locale in the HTML as served`, async ({ request }) => {
      const res = await request.get(path);
      expect(res.status()).toBe(200);
      check(path, await res.text());
    });
  }
}

test("hreflang on a page of each tree names all three and x-default", () => {
  test.skip(DEPLOYED || !existsSync(OUT), "reads out/");
  for (const p of ["index.html", "ru/community/index.html", "kk/privacy/index.html"]) {
    const html = readFileSync(join(OUT, p), "utf8");
    const langs = [...html.matchAll(/<link rel="alternate" hrefLang="([^"]+)"/g)].map((m) => m[1]);
    expect(new Set(langs), p).toEqual(new Set(["en", "ru", "kk", "x-default"]));
  }
});
