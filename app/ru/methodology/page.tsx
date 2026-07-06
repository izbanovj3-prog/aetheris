import type { Metadata } from "next";
import { Footer } from "@/components/chrome/Footer";
import { MethodologyContent } from "@/components/pages/StaticPages";
import { getPageContent } from "@/lib/content";
import { hreflangAlternates } from "@/lib/i18n";

const c = getPageContent("ru");

export const metadata: Metadata = {
  title: c.methodology.metaTitle,
  description: c.methodology.metaDescription,
  alternates: {
    canonical: "/ru/methodology/",
    languages: hreflangAlternates("/methodology/"),
  },
};

export default function MethodologyPageRu() {
  return (
    <main className="flex-1">
      <MethodologyContent />
      <Footer />
    </main>
  );
}
