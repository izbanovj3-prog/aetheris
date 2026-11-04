import type { Metadata } from "next";
import { Footer } from "@/components/chrome/Footer";
import { LegalPage } from "@/components/pages/LegalPage";
import { getLegal } from "@/lib/legal";
import { hreflangAlternates } from "@/lib/i18n";

const d = getLegal("kk").terms;

export const metadata: Metadata = {
  title: d.metaTitle,
  description: d.metaDescription,
  alternates: {
    canonical: "/kk/terms/",
    languages: hreflangAlternates("/terms/"),
  },
};

export default function TermsPageKk() {
  return (
    <main className="flex-1">
      <LegalPage locale="kk" doc="terms" />
      <Footer />
    </main>
  );
}
