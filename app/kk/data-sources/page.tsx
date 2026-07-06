import type { Metadata } from "next";
import { Footer } from "@/components/chrome/Footer";
import { DataSourcesContent } from "@/components/pages/StaticPages";
import { getPageContent } from "@/lib/content";
import { hreflangAlternates } from "@/lib/i18n";

const c = getPageContent("kk");

export const metadata: Metadata = {
  title: c.dataSources.metaTitle,
  description: c.dataSources.metaDescription,
  alternates: {
    canonical: "/kk/data-sources/",
    languages: hreflangAlternates("/data-sources/"),
  },
};

export default function DataSourcesPageKk() {
  return (
    <main className="flex-1">
      <DataSourcesContent />
      <Footer />
    </main>
  );
}
