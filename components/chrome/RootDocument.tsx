import type { Metadata, Viewport } from "next";
import { Syne, Albert_Sans, IBM_Plex_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "@/app/globals.css";
import { LangSync } from "@/components/chrome/LangSync";
import { Nav } from "@/components/chrome/Nav";
import { SkipLink } from "@/components/chrome/SkipLink";
import { Providers } from "@/app/providers";
import { OG_LOCALE, SITE } from "@/lib/site";
import type { Locale } from "@/lib/i18n";

/* ─────────────────────────────────────────────────────────────
   The one <html> document, shared by the three root layouts:
   app/(en)/layout.tsx, app/ru/layout.tsx and app/kk/layout.tsx. Each
   tree has its own root layout so the prerendered HTML carries the right
   `lang` and og:locale — a single root layout can only print one.
   Moving between trees is a full page load (Next's rule for separate
   root layouts); the language switch is the only place that happens.
   ───────────────────────────────────────────────────────────── */

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  display: "swap",
});

const albert = Albert_Sans({
  variable: "--font-albert",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

/** Site-wide metadata for one language tree. */
export function rootMetadata(locale: Locale): Metadata {
  return {
    metadataBase: new URL(SITE.url),
    title: {
      default: SITE.title,
      template: "%s — AETHERIS",
    },
    description: SITE.description,
    applicationName: SITE.name,
    authors: [{ name: SITE.creator }],
    creator: SITE.creator,
    publisher: SITE.creator,
    keywords: [...SITE.keywords],
    category: "technology",
    // NB: no `alternates.canonical` here — a canonical set in the root layout
    // is inherited by every child page, marking them all duplicates of "/".
    // Each page declares its own canonical instead.
    formatDetection: { telephone: false, address: false, email: false },
    // Deliberately no `title` or `description` inside openGraph/twitter here.
    // Metadata merges shallowly, and a nested field set in the root wins over
    // a child that only sets the top-level `title`/`description` — so pinning
    // them made every one of the ~140 pages share as the homepage, whatever
    // its own title said. Left unset, Next resolves both from each page's own
    // title and description, and the root's values still apply to "/" because
    // that is what its top-level title/description already are.
    openGraph: {
      type: "website",
      siteName: SITE.name,
      url: locale === "en" ? SITE.url : `${SITE.url}/${locale}/`,
      locale: OG_LOCALE[locale],
      alternateLocale: otherOgLocales(locale),
      // ru and kk get theirs from app/{ru,kk}/opengraph-image.png. English
      // is a plain file in public/: in the (en) route group the file
      // convention would publish it under a hashed name, and
      // /opengraph-image.png is linked from pages and already-shared posts.
      ...(locale === "en" && {
        images: [{ url: "/opengraph-image.png", width: 1200, height: 630, alt: SITE.ogImageAlt }],
      }),
    },
    twitter: {
      card: "summary_large_image",
      ...(locale === "en" && { images: [{ url: "/twitter-image.png", alt: SITE.ogImageAlt }] }),
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
  };
}

/** og:locale:alternate — the other two trees. */
export function otherOgLocales(locale: Locale): string[] {
  return (Object.keys(OG_LOCALE) as Locale[]).filter((l) => l !== locale).map((l) => OG_LOCALE[l]);
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  colorScheme: "dark",
  themeColor: [{ media: "(prefers-color-scheme: dark)", color: "#030608" }],
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE.url}/#organization`,
      name: SITE.creator,
      url: SITE.url,
      description: SITE.description,
      logo: `${SITE.url}/icon.svg`,
    },
    {
      "@type": "WebSite",
      "@id": `${SITE.url}/#website`,
      name: SITE.name,
      url: SITE.url,
      description: SITE.description,
      inLanguage: ["en", "ru", "kk"],
      publisher: { "@id": `${SITE.url}/#organization` },
    },
    {
      "@type": "WebApplication",
      name: SITE.title,
      url: SITE.url,
      applicationCategory: "Environmental data platform",
      operatingSystem: "Web",
      browserRequirements: "Requires a WebGL-capable browser",
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    },
  ],
};

export function RootDocument({
  lang,
  children,
}: Readonly<{
  lang: Locale;
  children: React.ReactNode;
}>) {
  return (
    <html
      lang={lang}
      data-scroll-behavior="smooth"
      suppressHydrationWarning
      className={`${syne.variable} ${albert.variable} ${plexMono.variable} h-full antialiased`}
    >
      <head>
        {/* Applies the reader's saved text size / theme before first paint so
            the page does not flash dark or small. Guarded: storage can throw. */}
        <script
          dangerouslySetInnerHTML={{
            // Language first, from the URL. Each tree's root layout already
            // prints its own lang; this is the fallback for the one document
            // that serves every tree — the 404 page.
            __html: `(function(){var d=document.documentElement,s=location.pathname.split('/')[1];if(s==='ru'||s==='kk')d.lang=s;try{var t=localStorage.getItem('aeth-text'),h=localStorage.getItem('aeth-theme');if(t==='2'||t==='3')d.setAttribute('data-text',t);if(h==='light')d.setAttribute('data-theme','light')}catch(e){}})()`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col grain">
        {/* Framer-motion ships its `initial` state as an inline style and
            animates it away on mount. With JS off that never happens, so the
            page body renders blank — the hero, every Reveal section, every
            stat readout. Inside <noscript> nothing will ever animate, so any
            element still sitting at inline opacity:0 is by definition stuck:
            force the lot visible. Scoped to no-JS only, so it cannot affect
            normal rendering. */}
        <noscript>
          {/* filter is reset too — the hero's hidden variant is
              blur(6px), which would otherwise print/render smeared. */}
          <style>{`.reveal-root,[style*="opacity:0"]{opacity:1!important;transform:none!important;filter:none!important}`}</style>
        </noscript>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <div className="atmosphere" aria-hidden />
        <div className="gridlines" aria-hidden />
        <Providers>
          <LangSync />
          <SkipLink />
          <Nav />
          <div id="main-content" tabIndex={-1} className="flex flex-col flex-1 outline-none">
            {children}
          </div>
        </Providers>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
