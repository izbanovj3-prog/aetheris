import type { Metadata } from "next";
import { MapClient } from "./MapClient";
import { getDict, hreflangAlternates } from "@/lib/i18n";

const dict = getDict("en");

export const metadata: Metadata = {
  title: dict.meta.atlasTitle,
  description: dict.meta.atlasDescription,
  alternates: {
    canonical: "/map/",
    languages: hreflangAlternates("/map/"),
  },
};

export default function MapPage() {
  return (
    <main className="flex-1">
      <MapClient />
    </main>
  );
}
