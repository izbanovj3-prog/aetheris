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
