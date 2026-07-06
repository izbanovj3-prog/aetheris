import type { Metadata } from "next";
import { Footer } from "@/components/chrome/Footer";
import { MissionContent } from "@/components/pages/StaticPages";
import { getPageContent } from "@/lib/content";
import { hreflangAlternates } from "@/lib/i18n";

const c = getPageContent("ru");

export const metadata: Metadata = {
  title: c.mission.metaTitle,
  description: c.mission.metaDescription,
  alternates: {
    canonical: "/ru/mission/",
    languages: hreflangAlternates("/mission/"),
  },
};

export default function MissionPageRu() {
  return (
    <main className="flex-1">
      <MissionContent />
      <Footer />
    </main>
  );
}
