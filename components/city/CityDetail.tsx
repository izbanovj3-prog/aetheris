"use client";

import Link from "next/link";
import {
  GlassCard,
  GlowButton,
  SourceNote,
  TelemetryTag,
} from "@/components/ui/primitives";
import { aqiBand, scoreBand } from "@/lib/data";
import { useLiveStations } from "@/lib/useLiveStations";

const TONE_TEXT = {
  emerald: "text-emerald",
  cyan: "text-cyan",
  amber: "text-amber",
  coral: "text-coral",
} as const;

/** Activity guidance per AQI band, following US EPA AirNow recommendations. */
const HEALTH_ADVICE: Record<ReturnType<typeof aqiBand>["label"], string> = {
  Good: "Air quality is satisfactory and poses little or no risk. It's a great time to be active outside.",
  Moderate:
    "Air quality is acceptable. Unusually sensitive people should consider reducing prolonged or heavy outdoor exertion; everyone else can be active as usual.",
  Sensitive:
    "Sensitive groups — children, older adults, pregnant people, and anyone with heart or lung disease — should reduce prolonged or heavy outdoor exertion and watch for symptoms like coughing or shortness of breath.",
  Unhealthy:
    "Everyone should reduce prolonged or heavy outdoor exertion; sensitive groups should avoid it. Consider moving workouts indoors and keeping windows closed during peak hours.",
  Hazardous:
    "Health alert: avoid all outdoor exertion. Stay indoors with windows closed, run an air purifier if available, and wear a well-fitting respirator (N95/FFP2) if you must go outside.",
};

export default function CityDetail({ id }: { id: string }) {
  const { stations, live, fetchedAt } = useLiveStations();
  const s = stations.find((st) => st.id === id);
  if (!s) return null; // the server page 404s unknown ids before this renders

  const band = aqiBand(s.aqi);
  const asOf = fetchedAt ? new Date(fetchedAt).toISOString() : undefined;
  const airSource = live
    ? "Open-Meteo Air Quality API (CAMS)"
    : "Aetheris modeled baseline (live feed pending)";

  const airMetrics = [
    { label: "PM2.5", value: s.pm25, unit: "µg/m³" },
    { label: "PM10", value: s.pm10, unit: "µg/m³" },
    { label: "NO₂", value: s.no2, unit: "ppb" },
    { label: "Temperature", value: s.temperature, unit: "°C" },
    { label: "Humidity", value: s.humidity, unit: "%" },
  ];

  const modeled = [
    { label: "Water quality", value: s.waterQuality, unit: "WQI", good: s.waterQuality },
    { label: "Biodiversity", value: s.biodiversity, unit: "BII", good: s.biodiversity },
    { label: "Industrial load", value: s.industrialEmissions, unit: "IEI", good: 100 - s.industrialEmissions },
    { label: "Climate risk", value: s.climateRisk, unit: "ERI", good: 100 - s.climateRisk },
    { label: "Sustainability", value: s.sustainability, unit: "/100", good: s.sustainability },
  ];

  return (
    <section className="max-w-5xl mx-auto px-6 pt-40 pb-24">
      <div className="flex flex-wrap items-center gap-3">
        <TelemetryTag tone="emerald">
          <span className="dot-live" />
          {live ? "Live readings" : "Model baseline"}
        </TelemetryTag>
        <span className="telemetry">
          {s.region} region · {s.lat.toFixed(2)}°N {s.lon.toFixed(2)}°E
        </span>
      </div>

      <h1 className="font-[family-name:var(--font-syne)] font-bold tracking-tight text-4xl sm:text-6xl mt-6 mb-12">
        {s.name}
      </h1>

      <div className="grid lg:grid-cols-[1.1fr_1fr] gap-5 items-stretch">
        <GlassCard bright ticks className="p-8">
          <div className="flex items-center justify-between mb-1">
            <span className="telemetry telemetry-bright">
              Air quality index
              <SourceNote source={airSource} asOf={asOf} className="ml-1.5" />
            </span>
            <span className={`telemetry ${TONE_TEXT[band.tone]}`}>{band.label}</span>
          </div>
          <div className={`readout text-6xl sm:text-7xl font-medium mt-3 ${TONE_TEXT[band.tone]}`}>
            {s.aqi}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-5 mt-8 border-t border-line pt-6">
            {airMetrics.map((m) => (
              <div key={m.label} className="flex flex-col gap-1">
                <span className="telemetry">{m.label}</span>
                <span className="readout text-lg">
                  {m.value}
                  <span className="text-ink-faint text-xs ml-1">{m.unit}</span>
                </span>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="p-8 flex flex-col">
          <span className="telemetry telemetry-bright">Health guidance</span>
          <p className="text-ink-dim leading-relaxed font-light mt-4 flex-1">
            {HEALTH_ADVICE[band.label]}
          </p>
          <span className="telemetry mt-6">
            Guidance: US EPA AirNow activity recommendations
          </span>
        </GlassCard>
      </div>

      <div className="mt-12">
        <div className="flex items-center gap-2 mb-5">
          <span className="telemetry telemetry-bright">Modeled indices</span>
          <SourceNote source="Aetheris modeled baseline" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {modeled.map((m) => {
            const tone = scoreBand(m.good).tone;
            return (
              <GlassCard key={m.label} className="p-5">
                <span className="telemetry">{m.label}</span>
                <div className={`readout text-2xl mt-2 ${TONE_TEXT[tone]}`}>
                  {m.value}
                  <span className="text-ink-faint text-xs ml-1">{m.unit}</span>
                </div>
              </GlassCard>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 mt-14">
        <GlowButton href="/map">See {s.name} on the Atlas</GlowButton>
        <GlowButton href="/dashboard" variant="ghost">
          Network intelligence
        </GlowButton>
        <Link
          href="/sensor-network"
          className="text-sm text-ink-dim hover:text-emerald transition-colors duration-300 link-sweep"
        >
          All monitored cities →
        </Link>
      </div>
    </section>
  );
}
