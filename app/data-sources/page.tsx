import type { Metadata } from "next";
import { Footer } from "@/components/chrome/Footer";

export const metadata: Metadata = {
  title: "Data sources",
  description:
    "The canonical attribution list for every layer and headline figure on Aetheris.",
};

// TODO: replace with real content — this table is the canonical home for the
// [SOURCE_NEEDED] citations scattered across the homepage. Fill in licences,
// exact endpoints and refresh cadence as sources are confirmed.
const SOURCES = [
  {
    name: "Open-Meteo Air Quality API",
    provides: "US AQI, PM2.5, PM10, NO₂ for all 28 monitored cities (CAMS global model)",
    status: "Live — fetched client-side on each visit",
  },
  {
    name: "Open-Meteo Weather API",
    provides: "Temperature and relative humidity per city",
    status: "Live — fetched client-side on each visit",
  },
  {
    name: "Aetheris baseline model",
    provides: "Water quality (WQI), biodiversity (BII), industrial load (IEI) and risk (ERI) indices",
    status: "Modeled — deterministic regional baseline, refreshed per build",
  },
  {
    name: "[SOURCE_NEEDED]",
    provides: "Headline network figures: datapoints/day, station count, network uptime",
    status: "Attribution pending",
  },
];

export default function DataSourcesPage() {
  return (
    <main className="flex-1">
      <section className="max-w-3xl mx-auto px-6 pt-40 pb-24">
        <span className="telemetry telemetry-bright">Science</span>
        <h1 className="font-[family-name:var(--font-syne)] font-bold tracking-tight text-4xl sm:text-5xl mt-5 mb-6">
          Data sources
        </h1>
        <p className="text-ink-dim text-lg font-light leading-relaxed max-w-xl">
          Every number on Aetheris should be traceable. This page is the
          canonical attribution list — the ⓘ markers across the platform
          resolve here.
        </p>

        <div className="mt-14 flex flex-col gap-10">
          {SOURCES.map((s) => (
            <div key={s.name} className="border-t border-line pt-8">
              <h2 className="font-[family-name:var(--font-syne)] font-bold text-xl mb-2">
                {s.name}
              </h2>
              <p className="text-ink-dim leading-relaxed font-light mb-3">
                {s.provides}
              </p>
              <span className="telemetry">{s.status}</span>
            </div>
          ))}
        </div>
      </section>
      <Footer />
    </main>
  );
}
