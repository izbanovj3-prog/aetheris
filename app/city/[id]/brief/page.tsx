import type { Metadata } from "next";
import { notFound } from "next/navigation";
import CityBrief from "@/components/city/CityBrief";
import { Footer } from "@/components/chrome/Footer";
import { buildBrief } from "@/lib/brief";
import { getStations } from "@/lib/data";
import { SITE } from "@/lib/site";

// Static export: one brief per city, prerendered; unknown slugs 404.
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
  const brief = buildBrief(id);
  if (!brief) return {};
  const title = `${brief.station.name} — city action brief`;
  const description = `Ranked environmental interventions for ${brief.station.name}, ${brief.station.region} region. Primary stressor: ${brief.stressorLabel.toLowerCase()}. Measured air quality, modeled water and risk indices, and indicative impact estimates.`;
  return {
    title,
    description,
    alternates: { canonical: `/city/${id}/brief/` },
    openGraph: {
      type: "article",
      siteName: SITE.name,
      title,
      description,
      url: `${SITE.url}/city/${id}/brief/`,
      locale: SITE.locale,
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function CityBriefPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!getStations().some((s) => s.id === id)) notFound();
  return (
    <main className="flex-1">
      <CityBrief id={id} />
      <Footer />
    </main>
  );
}
