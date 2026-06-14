import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

// Required by `output: export` in Next 16 — emit a static robots.txt.
export const dynamic = "force-static";

/* Generated to a static robots.txt at build time (output: export). */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: `${SITE.url}/sitemap.xml`,
    host: SITE.url,
  };
}
