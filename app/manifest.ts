import type { MetadataRoute } from "next";
import { BRAND, SITE } from "@/lib/site";

// Required by `output: export` in Next 16 — emit a static manifest.
export const dynamic = "force-static";

/* Web app manifest — generated statically at build time. Enables
   installability and a branded splash/theme on mobile. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE.title,
    short_name: SITE.name,
    description: SITE.description,
    start_url: "/",
    display: "standalone",
    background_color: BRAND.abyss,
    theme_color: BRAND.abyss,
    categories: ["science", "education", "utilities"],
    icons: [
      { src: "/icon.svg", type: "image/svg+xml", sizes: "any" },
      { src: "/apple-icon", type: "image/png", sizes: "180x180" },
    ],
  };
}
