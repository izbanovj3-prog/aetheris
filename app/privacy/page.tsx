import type { Metadata } from "next";
import { Footer } from "@/components/chrome/Footer";
import { LegalPage } from "@/components/pages/LegalPage";
import { getLegal } from "@/lib/legal";
import { hreflangAlternates } from "@/lib/i18n";

const d = getLegal("en").privacy;

export const metadata: Metadata = {
  title: d.metaTitle,
  description: d.metaDescription,
  alternates: {
    canonical: "/privacy/",
    languages: hreflangAlternates("/privacy/"),
  },
};

export default function PrivacyPageEn() {
  return (
    <main className="flex-1">
      <LegalPage locale="en" doc="privacy" />
      <Footer />
    </main>
  );
}
