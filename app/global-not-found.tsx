import type { Metadata } from "next";
import { NotFoundScreen } from "@/components/chrome/ErrorScreens";
import { RootDocument, rootMetadata } from "@/components/chrome/RootDocument";

/* The single 404.html, served for every missing path in every tree. With
   three root layouts there is no one layout to put it in, so it is its own
   document (next.config.ts: experimental.globalNotFound). It prints
   lang="en"; the head script in RootDocument sets ru/kk from the address,
   and NotFoundScreen reads the language from it too. */
// It is outside every root layout, so the site-wide metadata (metadataBase,
// icons, og:locale) is stated here too.
export const metadata: Metadata = {
  ...rootMetadata("en"),
  title: "Page not found · Страница не найдена · Бет табылмады",
  description: "There is no page at this address.",
  robots: { index: false },
};

export default function GlobalNotFound() {
  return (
    <RootDocument lang="en">
      <NotFoundScreen />
    </RootDocument>
  );
}
