import type { Metadata } from "next";
import { Hero } from "@/components/landing/Hero";
import {
  AssistantPreview,
  AtlasShowcase,
  CommunityStrip,
  FinalCta,
  Pillars,
  StatsBand,
  Ticker,
} from "@/components/landing/Sections";
import { Footer } from "@/components/chrome/Footer";
import { getDict, hreflangAlternates } from "@/lib/i18n";

const dict = getDict("ru");

export const metadata: Metadata = {
  title: dict.meta.homeTitle,
  description: dict.meta.homeDescription,
  alternates: {
    canonical: "/ru/",
    languages: hreflangAlternates("/"),
  },
};

export default function HomeRu() {
  return (
    <main className="flex-1">
      <Hero />
      <Ticker />
      <Pillars />
      <StatsBand />
      <AtlasShowcase />
      <AssistantPreview />
      <CommunityStrip />
      <FinalCta />
      <Footer />
    </main>
  );
}
