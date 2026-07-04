import type { MetadataRoute } from "next";
import { getStations } from "@/lib/data";
import { ROUTES, SITE } from "@/lib/site";

// Required by `output: export` in Next 16 — emit a static sitemap.xml.
export const dynamic = "force-static";

/* Generated to a static sitemap.xml at build time (output: export). */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const cityRoutes = getStations().map((s) => `/city/${s.id}`);
  return [...ROUTES, ...cityRoutes].map((route) => ({
    url: `${SITE.url}${route}`,
    lastModified: now,
    changeFrequency: route === "/" ? "weekly" : "daily",
    priority: route === "/" ? 1 : route.startsWith("/city/") ? 0.7 : 0.8,
  }));
}
