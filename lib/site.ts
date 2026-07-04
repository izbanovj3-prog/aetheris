/* ─────────────────────────────────────────────────────────────
   AETHERIS · Site-wide constants
   Single source of truth for metadata, OG images, sitemap, robots
   and the web manifest. Override the origin at build with
   NEXT_PUBLIC_SITE_URL (e.g. on a custom domain).
   ───────────────────────────────────────────────────────────── */

export const SITE = {
  name: "AETHERIS",
  title: "AETHERIS — Kazakhstan Environmental Intelligence",
  tagline: "The operating system for Kazakhstan's environment.",
  description:
    "National environmental intelligence for Kazakhstan — real-time air quality, water, industrial emissions and ecological risk across every region and major city, in one living model.",
  // `.trim()` also strips a leading BOM (U+FEFF) — some shells prepend one when
  // setting env vars — so `new URL(SITE.url)` never throws at build time.
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? "https://aetherisearth.live")
    .trim()
    .replace(/\/$/, ""),
  locale: "en_US",
  creator: "Aetheris Systems",
  keywords: [
    "Kazakhstan environmental monitoring",
    "Kazakhstan air quality",
    "Almaty air quality",
    "Astana air quality",
    "AQI Kazakhstan",
    "industrial emissions",
    "Aral Sea",
    "Lake Balkhash",
    "climate risk",
    "environmental intelligence",
    "ecological monitoring",
    "environmental data visualization",
  ],
} as const;

/** Primary navigable surfaces — drives the sitemap. */
export const ROUTES = [
  "/",
  "/map",
  "/dashboard",
  "/assistant",
  "/community",
  "/methodology",
  "/data-sources",
  "/sensor-network",
  "/mission",
  "/press",
  "/contact",
] as const;

/** Brand palette references used by generated images. */
export const BRAND = {
  abyss: "#030608",
  carbon: "#0a1116",
  emerald: "#2de2a6",
  cyan: "#4fd8f7",
  atmos: "#4f9dde",
  ink: "#e9f3f4",
  inkDim: "#93a8b0",
} as const;
