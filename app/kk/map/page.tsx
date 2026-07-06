import type { Metadata } from "next";
import { MapClient } from "../../map/MapClient";
import { getDict, hreflangAlternates } from "@/lib/i18n";

const dict = getDict("kk");

export const metadata: Metadata = {
  title: dict.meta.atlasTitle,
  description: dict.meta.atlasDescription,
  alternates: {
    canonical: "/kk/map/",
    languages: hreflangAlternates("/map/"),
  },
};

export default function MapPageKk() {
  return (
    <main className="flex-1">
      <MapClient />
    </main>
  );
}
