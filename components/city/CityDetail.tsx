"use client";

import Link from "next/link";
import {
  GlassCard,
  GlowButton,
  SourceNote,
  TelemetryTag,
} from "@/components/ui/primitives";
import { aqiBand, scoreBand } from "@/lib/data";
import { cityName, regionLabel } from "@/lib/i18n";
import { useDict, useLocale } from "@/lib/useLocale";
import { useLiveStations } from "@/lib/useLiveStations";

const TONE_TEXT = {
  emerald: "text-emerald",
  cyan: "text-cyan",
  amber: "text-amber",
  coral: "text-coral",
} as const;

export default function CityDetail({ id }: { id: string }) {
  const locale = useLocale();
  const dict = useDict();
  const { stations, live, fetchedAt } = useLiveStations();
  const s = stations.find((st) => st.id === id);
  if (!s) return null; // the server page 404s unknown ids before this renders

  const band = aqiBand(s.aqi);
  const name = cityName(s.id, s.name, locale);
  const asOf = fetchedAt ? new Date(fetchedAt).toISOString() : undefined;
  const airSource = live
    ? "Open-Meteo Air Quality API (CAMS)"
    : "Aetheris modeled baseline (live feed pending)";

  const airMetrics = [
    { label: dict.city.pm25, value: s.pm25, unit: "µg/m³" },
    { label: dict.city.pm10, value: s.pm10, unit: "µg/m³" },
    { label: dict.city.no2, value: s.no2, unit: "ppb" },
    { label: dict.city.temperature, value: s.temperature, unit: "°C" },
    { label: dict.city.humidity, value: s.humidity, unit: "%" },
  ];

  const modeled = [
    { label: dict.city.water, value: s.waterQuality, unit: "WQI", good: s.waterQuality },
    { label: dict.city.bio, value: s.biodiversity, unit: "BII", good: s.biodiversity },
    { label: dict.city.industrial, value: s.industrialEmissions, unit: "IEI", good: 100 - s.industrialEmissions },
    { label: dict.city.risk, value: s.climateRisk, unit: "ERI", good: 100 - s.climateRisk },
    { label: dict.city.sustainability, value: s.sustainability, unit: "/100", good: s.sustainability },
  ];

  return (
    <section className="max-w-5xl mx-auto px-6 pt-40 pb-24">
      <div className="flex flex-wrap items-center gap-3">
        <TelemetryTag tone="emerald">
          <span className="dot-live" />
          {live ? dict.city.badgeLive : dict.city.badgeBaseline}
        </TelemetryTag>
        <span className="telemetry">
          {regionLabel(s.region, locale)} · {s.lat.toFixed(2)}°N {s.lon.toFixed(2)}°E
        </span>
      </div>

      <h1 className="font-[family-name:var(--font-syne)] font-bold tracking-tight text-4xl sm:text-6xl mt-6 mb-12">
        {name}
      </h1>

      <div className="grid lg:grid-cols-[1.1fr_1fr] gap-5 items-stretch">
        <GlassCard bright ticks className="p-8">
          <div className="flex items-center justify-between mb-1">
            <span className="telemetry telemetry-bright">
              {dict.city.aqiLabel}
              <SourceNote source={airSource} asOf={asOf} className="ml-1.5" />
            </span>
            <span className={`telemetry ${TONE_TEXT[band.tone]}`}>
              {dict.city.band[band.label]}
            </span>
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
          <span className="telemetry telemetry-bright">{dict.city.healthTitle}</span>
          <p className="text-ink-dim leading-relaxed font-light mt-4 flex-1">
            {dict.city.advice[band.label]}
          </p>
          <span className="telemetry mt-6">{dict.city.healthSource}</span>
        </GlassCard>
      </div>

      <div className="mt-12">
        <div className="flex items-center gap-2 mb-5">
          <span className="telemetry telemetry-bright">{dict.city.modeledTitle}</span>
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
        <GlowButton href="/map">{dict.city.ctaAtlas(name)}</GlowButton>
        <GlowButton href="/dashboard" variant="ghost">
          {dict.city.ctaIntel}
        </GlowButton>
        <Link
          href="/sensor-network"
          className="text-sm text-ink-dim hover:text-emerald transition-colors duration-300 link-sweep"
        >
          {dict.city.allCities}
        </Link>
      </div>
    </section>
  );
}
