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
    "Kazakhstan's environment on one map — air quality from open data (Open-Meteo / CAMS) plus clearly marked modelled estimates for water, industrial pollution and ecological risk, across every region.",
  // `.trim()` also strips a leading BOM (U+FEFF) — some shells prepend one when
  // setting env vars — so `new URL(SITE.url)` never throws at build time.
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? "https://aetherisearth.live")
    .trim()
    .replace(/\/$/, ""),
  locale: "en_US",
  /** Alt text of the English preview card, public/opengraph-image.png
   *  (scripts/og-images.mjs renders the card; keep its `alt` the same). */
  ogImageAlt:
    "Aetheris — Kazakhstan’s environment on one open map. Air quality from open data; water, industrial pollution and biodiversity are modelled estimates, marked as such.",
  creator: "Aetheris",
  keywords: [
    "Kazakhstan environment map",
    "Kazakhstan air quality",
    "Almaty air quality",
    "Astana air quality",
    "AQI Kazakhstan",
    "industrial pollution",
    "Aral Sea",
    "Lake Balkhash",
    "climate risk",
    "environmental intelligence",
    "state of the environment Kazakhstan",
    "environmental data visualization",
  ],
} as const;

/** og:locale per language tree (Open Graph uses language_TERRITORY). */
export const OG_LOCALE = { en: "en_US", ru: "ru_RU", kk: "kk_KZ" } as const satisfies Record<
  "en" | "ru" | "kk",
  string
>;

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
  "/privacy",
  "/terms",
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
