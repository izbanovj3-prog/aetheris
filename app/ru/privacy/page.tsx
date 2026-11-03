import type { Metadata } from "next";
import { Footer } from "@/components/chrome/Footer";
import { LegalPage } from "@/components/pages/LegalPage";
import { getLegal } from "@/lib/legal";
import { hreflangAlternates } from "@/lib/i18n";

const d = getLegal("ru").privacy;

export const metadata: Metadata = {
  title: d.metaTitle,
  description: d.metaDescription,
  alternates: {
    canonical: "/ru/privacy/",
    languages: hreflangAlternates("/privacy/"),
  },
};

export default function PrivacyPageRu() {
  return (
    <main className="flex-1">
      <LegalPage locale="ru" doc="privacy" />
      <Footer />
    </main>
  );
}
