import type { Metadata } from "next";
import { Footer } from "@/components/chrome/Footer";

export const metadata: Metadata = {
  title: "Sensor network",
  description:
    "Coverage of the Aetheris monitoring network across Kazakhstan — cities, regions, hotspots and refresh cadence.",
};

// TODO: replace with real content — publish the audited station inventory
// (the footer's "2,847 stations reporting" figure needs substantiation here),
// per-station metadata and uptime history.
const FACTS = [
  { value: "28", label: "Cities monitored — every oblast represented" },
  { value: "17", label: "Regions covered" },
  { value: "14", label: "Named environmental hotspots under continuous watch, from the Aral Sea to the Semipalatinsk Polygon" },
  { value: "5", label: "Layers per station: air, industry, water, biodiversity, risk" },
];

export default function SensorNetworkPage() {
  return (
    <main className="flex-1">
      <section className="max-w-3xl mx-auto px-6 pt-40 pb-24">
        <span className="telemetry telemetry-bright">Science</span>
        <h1 className="font-[family-name:var(--font-syne)] font-bold tracking-tight text-4xl sm:text-5xl mt-5 mb-6">
          Sensor network
        </h1>
        <p className="text-ink-dim text-lg font-light leading-relaxed max-w-xl">
          Aetheris fuses satellite passes, public monitoring APIs and community
          reports into one national picture. Live air and weather readings
          refresh on every visit; modeled layers update with each platform
          build.
        </p>

        <div className="mt-14 flex flex-col gap-8">
          {FACTS.map((f) => (
            <div key={f.label} className="flex items-baseline gap-5 border-t border-line pt-6">
              <span className="readout text-3xl text-emerald shrink-0">{f.value}</span>
              <span className="text-ink-dim font-light leading-relaxed">{f.label}</span>
            </div>
          ))}
        </div>

        <p className="text-ink-faint text-sm font-light leading-relaxed mt-14 max-w-xl">
          A public, per-station inventory with hardware details and uptime
          history is in preparation.
        </p>
      </section>
      <Footer />
    </main>
  );
}
