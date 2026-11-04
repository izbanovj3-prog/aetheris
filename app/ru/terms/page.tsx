import type { Metadata } from "next";
import { Footer } from "@/components/chrome/Footer";
import { LegalPage } from "@/components/pages/LegalPage";
import { getLegal } from "@/lib/legal";
import { hreflangAlternates } from "@/lib/i18n";

const d = getLegal("ru").terms;

export const metadata: Metadata = {
  title: d.metaTitle,
  description: d.metaDescription,
  alternates: {
    canonical: "/ru/terms/",
    languages: hreflangAlternates("/terms/"),
  },
};

export default function TermsPageRu() {
  return (
    <main className="flex-1">
      <LegalPage locale="ru" doc="terms" />
      <Footer />
    </main>
  );
}
