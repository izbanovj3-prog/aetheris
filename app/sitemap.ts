import type { MetadataRoute } from "next";
import { getStations } from "@/lib/data";
import { ROUTES, SITE } from "@/lib/site";

// Required by `output: export` in Next 16 — emit a static sitemap.xml.
export const dynamic = "force-static";

/* Generated to a static sitemap.xml at build time (output: export). */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const cityPaths = getStations().map((s) => `/city/${s.id}`);
  // EN lives at the root; RU/KK trees carry the localized home + city pages.
  const localized = ["/ru", "/kk"].flatMap((prefix) => [
    prefix,
    ...cityPaths.map((c) => `${prefix}${c}`),
  ]);
  return [...ROUTES, ...cityPaths, ...localized].map((route) => ({
    url: `${SITE.url}${route}`,
    lastModified: now,
    changeFrequency: route === "/" ? "weekly" : "daily",
    priority: route === "/" ? 1 : route.includes("/city/") ? 0.7 : 0.8,
  }));
}
