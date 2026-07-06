import type { Metadata } from "next";
import { Footer } from "@/components/chrome/Footer";
import { SensorNetworkContent } from "@/components/pages/StaticPages";
import { getPageContent } from "@/lib/content";
import { hreflangAlternates } from "@/lib/i18n";

const c = getPageContent("ru");

export const metadata: Metadata = {
  title: c.sensorNetwork.metaTitle,
  description: c.sensorNetwork.metaDescription,
  alternates: {
    canonical: "/ru/sensor-network/",
    languages: hreflangAlternates("/sensor-network/"),
  },
};

export default function SensorNetworkPageRu() {
  return (
    <main className="flex-1">
      <SensorNetworkContent />
      <Footer />
    </main>
  );
}
