import type { Metadata } from "next";
import { hreflangAlternates } from "@/lib/i18n";
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

export const metadata: Metadata = {
  alternates: {
    canonical: "/",
    languages: hreflangAlternates("/"),
  },
};

export default function Home() {
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
