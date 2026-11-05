import type { Metadata } from "next";
import { Footer } from "@/components/chrome/Footer";
import { MissionContent } from "@/components/pages/StaticPages";
import { getPageContent } from "@/lib/content";
import { hreflangAlternates } from "@/lib/i18n";

const c = getPageContent("en");

export const metadata: Metadata = {
  title: c.mission.metaTitle,
  description: c.mission.metaDescription,
  alternates: {
    canonical: "/mission/",
    languages: hreflangAlternates("/mission/"),
  },
};

export default function MissionPage() {
  return (
    <main className="flex-1">
      <MissionContent />
      <Footer />
    </main>
  );
}
