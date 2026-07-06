import type { Metadata } from "next";
import { Footer } from "@/components/chrome/Footer";
import { SensorNetworkContent } from "@/components/pages/StaticPages";
import { getPageContent } from "@/lib/content";
import { hreflangAlternates } from "@/lib/i18n";

const c = getPageContent("kk");

export const metadata: Metadata = {
  title: c.sensorNetwork.metaTitle,
  description: c.sensorNetwork.metaDescription,
  alternates: {
    canonical: "/kk/sensor-network/",
    languages: hreflangAlternates("/sensor-network/"),
  },
};

export default function SensorNetworkPageKk() {
  return (
    <main className="flex-1">
      <SensorNetworkContent />
      <Footer />
    </main>
  );
}
