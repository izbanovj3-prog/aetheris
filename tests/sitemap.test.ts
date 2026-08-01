import { describe, expect, it } from "vitest";
import sitemap from "@/app/sitemap";
import { getStations } from "@/lib/data";
import { SITE } from "@/lib/site";

/* The sitemap shipped 114 entries that 308-redirected, because
   next.config sets trailingSlash and the routes were listed without one —
   so every URL advertised disagreed with the canonical on the page it
   redirects to. Twenty-nine more indexable pages were missing entirely.
   Neither is visible on the site itself, which is why they survived. */

const entries = sitemap();
const urls = entries.map((e) => e.url);

describe("sitemap", () => {
  it("emits absolute URLs on the canonical origin", () => {
    for (const u of urls) expect(u.startsWith(`${SITE.url}/`)).toBe(true);
  });

  /* The rule that broke. Asserted over every entry rather than a sample,
     because a single route added without the slash reintroduces it. */
  it("ends every URL with a trailing slash, matching trailingSlash: true", () => {
    const unslashed = urls.filter((u) => !u.endsWith("/"));
    expect(unslashed).toEqual([]);
  });

  it("lists no URL twice", () => {
    expect(new Set(urls).size).toBe(urls.length);
  });

  it("includes the home page exactly once", () => {
    expect(urls.filter((u) => u === `${SITE.url}/`)).toHaveLength(1);
  });

  it("covers every city profile in all three language trees", () => {
    for (const s of getStations()) {
      expect(urls).toContain(`${SITE.url}/city/${s.id}/`);
      expect(urls).toContain(`${SITE.url}/ru/city/${s.id}/`);
      expect(urls).toContain(`${SITE.url}/kk/city/${s.id}/`);
    }
  });

  /* Linked from every city page and indexable, but absent from the map
     until the audit. */
  it("covers every city action brief", () => {
    for (const s of getStations()) {
      expect(urls).toContain(`${SITE.url}/city/${s.id}/brief/`);
    }
  });

  it("includes the standalone Oxford Challenge page", () => {
    expect(urls).toContain(`${SITE.url}/oxford-challenge/`);
  });

  it("gives the home page top priority and briefs the lowest", () => {
    const home = entries.find((e) => e.url === `${SITE.url}/`);
    const brief = entries.find((e) => e.url.endsWith("/brief/"));
    expect(home?.priority).toBe(1);
    expect(brief?.priority).toBe(0.5);
  });

  it("stamps every entry with a lastModified date", () => {
    for (const e of entries) expect(e.lastModified).toBeInstanceOf(Date);
  });

  /* /community is the one route with no RU or KK tree — /ru/community/ is a
     404. Advertising it would put two dead URLs in front of a crawler.
     Map, dashboard and assistant were translated later and do have trees;
     this test is the reminder to move community across if it ever follows. */
  it("does not advertise the untranslated community route", () => {
    expect(urls).not.toContain(`${SITE.url}/ru/community/`);
    expect(urls).not.toContain(`${SITE.url}/kk/community/`);
  });

  it("does advertise the routes that are translated", () => {
    for (const p of ["map", "dashboard", "assistant", "methodology"]) {
      expect(urls).toContain(`${SITE.url}/ru/${p}/`);
      expect(urls).toContain(`${SITE.url}/kk/${p}/`);
    }
  });
});
