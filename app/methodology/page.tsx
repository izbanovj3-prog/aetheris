import type { Metadata } from "next";
import { Footer } from "@/components/chrome/Footer";

export const metadata: Metadata = {
  title: "Methodology",
  description:
    "How Aetheris turns raw environmental signals into the indices shown across the platform — and where the current model's limits are.",
};

// TODO: replace with real content — expand each section into the full
// published methodology (formulas, breakpoints, validation protocol).
const SECTIONS = [
  {
    title: "Air quality",
    body: "City-level AQI follows the US EPA 0–500 scale, derived from PM2.5, PM10 and NO₂ concentrations. Live readings come from the Open-Meteo Air Quality API (CAMS global model) and are merged over the model baseline on each visit; NO₂ is converted from µg/m³ to ppb for display.",
  },
  {
    title: "Water, biodiversity & industry",
    body: "The Water Quality (WQI), Biodiversity Intactness (BII) and Industrial Load (IEI) indices are currently modeled from a deterministic regional baseline — no free real-time point feed exists for these layers yet. Treat them as indicative, not measured.",
  },
  {
    title: "Composite risk",
    body: "The Environmental Risk Index (ERI) blends the layer indices with regional climate-risk weightings into a single 0–100 score per city.",
  },
  {
    title: "Validation",
    body: "Cross-checks between modeled values, live readings and community field reports are being formalised. This section will document the validation protocol and known error bounds.",
  },
];

export default function MethodologyPage() {
  return (
    <main className="flex-1">
      <section className="max-w-3xl mx-auto px-6 pt-40 pb-24">
        <span className="telemetry telemetry-bright">Science</span>
        <h1 className="font-[family-name:var(--font-syne)] font-bold tracking-tight text-4xl sm:text-5xl mt-5 mb-6">
          Methodology
        </h1>
        <p className="text-ink-dim text-lg font-light leading-relaxed max-w-xl">
          How Aetheris turns raw signals into the indices you see across the
          platform — and, just as important, which layers are measured and
          which are still modeled.
        </p>

        <div className="mt-14 flex flex-col gap-12">
          {SECTIONS.map((s) => (
            <div key={s.title} className="border-t border-line pt-8">
              <h2 className="font-[family-name:var(--font-syne)] font-bold text-2xl mb-3">
                {s.title}
              </h2>
              <p className="text-ink-dim leading-relaxed font-light">
                {s.body}
              </p>
            </div>
          ))}
        </div>
      </section>
      <Footer />
    </main>
  );
}
