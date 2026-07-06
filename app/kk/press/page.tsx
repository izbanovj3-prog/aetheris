import type { Metadata } from "next";
import { Footer } from "@/components/chrome/Footer";
import { PressContent } from "@/components/pages/StaticPages";
import { getPageContent } from "@/lib/content";
import { hreflangAlternates } from "@/lib/i18n";

const c = getPageContent("kk");

export const metadata: Metadata = {
  title: c.press.metaTitle,
  description: c.press.metaDescription,
  alternates: {
    canonical: "/kk/press/",
    languages: hreflangAlternates("/press/"),
  },
};

export default function PressPageKk() {
  return (
    <main className="flex-1">
      <PressContent />
      <Footer />
    </main>
  );
}
