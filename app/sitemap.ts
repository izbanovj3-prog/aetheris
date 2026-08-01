import type { MetadataRoute } from "next";
import { getStations } from "@/lib/data";
import { isLocalized } from "@/lib/i18n";
import { ROUTES, SITE } from "@/lib/site";

// Required by `output: export` in Next 16 — emit a static sitemap.xml.
export const dynamic = "force-static";

/**
 * next.config.ts sets `trailingSlash: true`, so /community serves a 308 to
 * /community/ and every page's own canonical carries the slash. A sitemap
 * listing the unslashed form therefore advertised 114 redirects that
 * disagreed with the canonical on the page they redirect to. Normalise
 * here rather than at each call site, so a route added to ROUTES cannot
 * reintroduce it.
 */
const withSlash = (path: string) => (path.endsWith("/") ? path : `${path}/`);

/* Generated to a static sitemap.xml at build time (output: export). */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const stations = getStations();
  const cityPaths = stations.map((s) => `/city/${s.id}`);
  // Every city page links to its action brief, and each one is a real
  // indexable page — they were reachable and crawlable but absent here.
  const briefPaths = stations.map((s) => `/city/${s.id}/brief`);
  // EN lives at the root; RU/KK trees mirror every path that has a translation
  // (home, stub pages, city profiles) — map/dashboard/assistant/community stay EN.
  const translatable = [...ROUTES.filter(isLocalized), ...cityPaths];
  const localized = ["/ru", "/kk"].flatMap((prefix) =>
    translatable.map((p) => (p === "/" ? prefix : `${prefix}${p}`)),
  );
  // Reached only from a footer link, but public, indexable and the page the
  // project is actually judged on. It has no RU/KK variant.
  const standalone = ["/oxford-challenge"];

  return [...ROUTES, ...cityPaths, ...briefPaths, ...standalone, ...localized].map(
    (route) => ({
      url: `${SITE.url}${withSlash(route)}`,
      lastModified: now,
      changeFrequency: route === "/" ? "weekly" : "daily",
      priority:
        route === "/"
          ? 1
          : route.endsWith("/brief")
            ? 0.5
            : route.includes("/city/")
              ? 0.7
              : 0.8,
    }),
  );
}
