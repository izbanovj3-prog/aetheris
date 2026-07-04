import type { Metadata } from "next";
import { MapClient } from "./MapClient";

export const metadata: Metadata = {
  title: "Kazakhstan Atlas",
  description:
    "A living map of Kazakhstan — air quality, industrial emissions, water, biodiversity and environmental risk rendered as continuous fields across 28 cities and 17 regions.",
  alternates: { canonical: "/map/" },
};

export default function MapPage() {
  return (
    <main className="flex-1">
      <MapClient />
    </main>
  );
}
