import type { MetadataRoute } from "next";
import { ROUTES, SITE } from "@/lib/site";

// Required by `output: export` in Next 16 — emit a static sitemap.xml.
export const dynamic = "force-static";

/* Generated to a static sitemap.xml at build time (output: export). */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return ROUTES.map((route) => ({
    url: `${SITE.url}${route}`,
    lastModified: now,
    changeFrequency: route === "/" ? "weekly" : "daily",
    priority: route === "/" ? 1 : 0.8,
  }));
}
