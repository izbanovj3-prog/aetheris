import type { Metadata } from "next";
import { Footer } from "@/components/chrome/Footer";
import { MethodologyContent } from "@/components/pages/StaticPages";
import { getPageContent } from "@/lib/content";
import { hreflangAlternates } from "@/lib/i18n";

const c = getPageContent("en");

export const metadata: Metadata = {
  title: c.methodology.metaTitle,
  description: c.methodology.metaDescription,
  alternates: {
    canonical: "/methodology/",
    languages: hreflangAlternates("/methodology/"),
  },
};

export default function MethodologyPage() {
  return (
    <main className="flex-1">
      <MethodologyContent />
      <Footer />
    </main>
  );
}
