import type { Metadata } from "next";
import { notFound } from "next/navigation";
import CityDetail from "@/components/city/CityDetail";
import { Footer } from "@/components/chrome/Footer";
import { getStations } from "@/lib/data";
import { cityName, getDict, hreflangAlternates, regionLabel } from "@/lib/i18n";

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
  const dict = getDict("ru");
  const name = cityName(s.id, s.name, "ru");
  return {
    title: dict.meta.cityTitle(name),
    description: dict.meta.cityDescription(name, regionLabel(s.region, "ru")),
    alternates: {
      canonical: `/ru/city/${s.id}/`,
      languages: hreflangAlternates(`/city/${s.id}/`),
    },
  };
}

export default async function CityPageRu({
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
