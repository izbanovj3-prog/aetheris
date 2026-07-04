import type { Metadata } from "next";
import { notFound } from "next/navigation";
import CityDetail from "@/components/city/CityDetail";
import { Footer } from "@/components/chrome/Footer";
import { getStations } from "@/lib/data";

// Static export: all 28 cities prerender at build; unknown slugs 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return getStations().map((s) => ({ id: s.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const s = getStations().find((st) => st.id === id);
  if (!s) return {};
  return {
    title: `${s.name} air quality`,
    description: `Live air quality in ${s.name}, ${s.region} region — AQI, PM2.5, NO₂ and health guidance, plus modeled water, biodiversity and industrial-load indices.`,
    alternates: { canonical: `/city/${s.id}/` },
  };
}

export default async function CityPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!getStations().some((st) => st.id === id)) notFound();
  return (
    <main className="flex-1">
      <CityDetail id={id} />
      <Footer />
    </main>
  );
}
