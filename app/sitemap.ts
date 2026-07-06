import type { MetadataRoute } from "next";
import { getStations } from "@/lib/data";
import { isLocalized } from "@/lib/i18n";
import { ROUTES, SITE } from "@/lib/site";

// Required by `output: export` in Next 16 — emit a static sitemap.xml.
export const dynamic = "force-static";

/* Generated to a static sitemap.xml at build time (output: export). */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const cityPaths = getStations().map((s) => `/city/${s.id}`);
  // EN lives at the root; RU/KK trees mirror every path that has a translation
  // (home, stub pages, city profiles) — map/dashboard/assistant/community stay EN.
  const translatable = [...ROUTES.filter(isLocalized), ...cityPaths];
  const localized = ["/ru", "/kk"].flatMap((prefix) =>
    translatable.map((p) => (p === "/" ? prefix : `${prefix}${p}`)),
  );
  return [...ROUTES, ...cityPaths, ...localized].map((route) => ({
    url: `${SITE.url}${route}`,
    lastModified: now,
    changeFrequency: route === "/" ? "weekly" : "daily",
    priority: route === "/" ? 1 : route.includes("/city/") ? 0.7 : 0.8,
  }));
}
