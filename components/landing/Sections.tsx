"use client";

import Link from "next/link";
import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  GlassCard,
  GlowButton,
  Reveal,
  SectionHeading,
  SourceNote,
  StatReadout,
  TelemetryTag,
} from "@/components/ui/primitives";
import {
  HOTSPOTS,
  LAYERS,
  genSeries,
  getStations,
  networkStats,
  planetSummary,
  type LayerKey,
  type Station,
} from "@/lib/data";
import {
  cityName,
  getDict,
  hotspotName,
  localePath,
  numberLocale,
  type Locale,
} from "@/lib/i18n";
import { useDict, useLocale } from "@/lib/useLocale";
import { useLiveStations } from "@/lib/useLiveStations";

const NET = networkStats();

/* ── Telemetry ticker ─────────────────────────────────────── */

/** Build the strip from actual network state instead of canned strings:
 *  worst air, worst water, peak PM2.5, critical hotspots, network mean. */
function tickerItems(stations: Station[], live: boolean, locale: Locale): string[] {
  const dict = getDict(locale);
  const name = (s: Station) => cityName(s.id, s.name, locale).toUpperCase();
  const baseById = new Map(getStations().map((s) => [s.id, s]));
  // Trend arrows only mean something once live readings diverge from baseline.
  const arrow = (s: Station) => {
    if (!live) return "";
    const b = baseById.get(s.id);
    if (!b || Math.abs(s.aqi - b.aqi) < 6) return "";
    return s.aqi > b.aqi ? " ▲" : " ▼";
  };

  const byAqi = [...stations].sort((a, b) => b.aqi - a.aqi);
  const byPm = [...stations].sort((a, b) => b.pm25 - a.pm25);
  const byWater = [...stations].sort((a, b) => a.waterQuality - b.waterQuality);

  return [
    ...byAqi.slice(0, 5).map((s) => `${name(s)} AQI ${s.aqi}${arrow(s)}`),
    `${name(byPm[0])} PM2.5 ${byPm[0].pm25} µg/m³`,
    ...byWater.slice(0, 3).map((s) => `${name(s)} WQI ${s.waterQuality}`),
    ...HOTSPOTS.filter((h) => h.status === "critical").map(
      (h) => `${hotspotName(h.id, h.name, locale).toUpperCase()} — ${dict.ticker.critical}`,
    ),
    `${dict.ticker.networkMean} ${planetSummary(stations).meanAqi}`,
  ];
}

export function Ticker() {
  const locale = useLocale();
  const { stations, live, fetchedAt } = useLiveStations();
  const items = useMemo(
    () => tickerItems(stations, live, locale),
    [stations, live, locale],
  );
  const row = [...items, ...items];
  return (
    <div className="relative border-y border-line py-3.5 overflow-hidden bg-void/60">
      <div className="absolute inset-y-0 left-0 w-24 z-10 bg-gradient-to-r from-abyss to-transparent" />
      <div className="absolute inset-y-0 right-0 w-24 z-10 bg-gradient-to-l from-abyss to-transparent" />
      {/* one citation for the whole strip — per-item tooltips can't be
          hovered inside an infinite marquee */}
      <span className="absolute right-3 top-1/2 -translate-y-1/2 z-20">
        <SourceNote
          source={
            live
              ? "AQI/PM2.5 — Open-Meteo (CAMS); WQI & hotspots — Aetheris modeled baseline"
              : "Aetheris modeled baseline (live feed pending)"
          }
          asOf={fetchedAt ? new Date(fetchedAt).toISOString() : undefined}
        />
      </span>
      <motion.div
        className="flex gap-10 whitespace-nowrap w-max"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
      >
        {row.map((t, i) => (
          <span key={i} className="telemetry telemetry-bright flex items-center gap-10">
            {t}
            <span className="w-1 h-1 rounded-full bg-emerald/50" />
          </span>
        ))}
      </motion.div>
    </div>
  );
}

/* ── Pillars: Sense / Reason / Act ────────────────────────── */

const PILLAR_ACCENTS = ["from-cyan/60", "from-emerald/60", "from-atmos/60"];

export function Pillars() {
  const locale = useLocale();
  const dict = useDict();
  const readings = NET.dailyReadings.toLocaleString(numberLocale(locale));
  return (
    <section className="max-w-6xl mx-auto px-6 pt-28">
      <SectionHeading
        tag={dict.pillars.tag}
        title={
          <>
            {dict.pillars.titleA}
            <span className="display-gradient">{dict.pillars.titleAccent}</span>
          </>
        }
        lede={dict.pillars.lede}
      />
      <div className="grid md:grid-cols-3 gap-5 mt-14">
        {dict.pillars.items.map((p, i) => (
          <Reveal key={p.title} index={i}>
            <GlassCard className="group p-7 h-full relative overflow-hidden transition-colors duration-500 hover:border-line-bright">
              <div
                className={`absolute top-0 left-0 right-0 h-px bg-gradient-to-r ${PILLAR_ACCENTS[i]} to-transparent`}
              />
              <span className="readout text-ink-faint text-sm">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="font-[family-name:var(--font-syne)] font-bold text-2xl mt-3 mb-3 group-hover:text-emerald transition-colors duration-500">
                {p.title}
              </h3>
              <p className="text-ink-dim leading-relaxed text-[15px] font-light">
                {p.body.replace("{readings}", readings)}
              </p>
            </GlassCard>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ── Live stats band ──────────────────────────────────────── */

export function StatsBand() {
  const dict = useDict();
  return (
    <section className="max-w-6xl mx-auto px-6 pt-28">
      <Reveal>
        <GlassCard bright ticks className="scanline px-8 py-10 grid grid-cols-2 lg:grid-cols-4 gap-8">
          <StatReadout
            value={NET.dailyReadings}
            label={dict.stats.readings}
            tone="cyan"
            source={`Open-Meteo (CAMS): ${NET.cities} cities × ${NET.liveMetrics} metrics × ${NET.refreshesPerDay} hourly updates`}
          />
          <StatReadout value={NET.cities} label={dict.stats.cities} tone="emerald" />
          <StatReadout value={NET.regions} label={dict.stats.regions} tone="atmos" />
          <StatReadout value={NET.hotspots} label={dict.stats.hotspots} tone="amber" />
        </GlassCard>
      </Reveal>
    </section>
  );
}

/* ── Atlas layers showcase ────────────────────────────────── */

function MiniSpark({ k, color }: { k: string; color: string }) {
  const pts = genSeries(k, 40, 50, 22);
  const max = Math.max(...pts.map((p) => p.v));
  const min = Math.min(...pts.map((p) => p.v));
  const d = pts
    .map(
      (p, i) =>
        `${i === 0 ? "M" : "L"}${(i / (pts.length - 1)) * 100},${
          32 - ((p.v - min) / (max - min || 1)) * 28
        }`,
    )
    .join(" ");
  return (
    <svg viewBox="0 0 100 34" className="w-full h-9" preserveAspectRatio="none" aria-hidden>
      <path d={d} fill="none" stroke={color} strokeWidth="1.4" opacity="0.85" />
      <path d={`${d} L100,34 L0,34 Z`} fill={color} opacity="0.07" />
    </svg>
  );
}

export function AtlasShowcase() {
  const dict = useDict();
  const locale = useLocale();
  const keys = Object.keys(LAYERS) as LayerKey[];
  return (
    <section className="max-w-6xl mx-auto px-6 pt-32">
      <div className="grid lg:grid-cols-[1fr_1.2fr] gap-12 items-start">
        <div className="lg:sticky lg:top-32 flex flex-col items-start gap-7">
          <SectionHeading
            tag={dict.atlas.tag}
            title={
              <>
                {dict.atlas.title1}
                <br />
                {dict.atlas.title2}
              </>
            }
            lede={dict.atlas.lede}
          />
          <Reveal index={3}>
            <GlowButton href={localePath("/map", locale)}>{dict.atlas.cta}</GlowButton>
          </Reveal>
        </div>

        <div className="flex flex-col gap-4">
          {keys.map((k, i) => {
            const layer = LAYERS[k];
            const copy = dict.atlas.layers[k];
            return (
              <Reveal key={k} index={i}>
                <Link href={localePath("/map", locale)} className="block group">
                  <GlassCard className="p-6 transition-all duration-500 group-hover:border-line-bright group-hover:translate-x-1.5">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-3">
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ background: layer.color, boxShadow: `0 0 10px ${layer.color}` }}
                        />
                        <span className="font-[family-name:var(--font-syne)] font-bold text-lg">
                          {copy.label}
                        </span>
                      </div>
                      <span className="telemetry">{layer.unit}</span>
                    </div>
                    <p className="text-ink-faint text-sm font-light mb-4">
                      {copy.describe}
                    </p>
                    <MiniSpark k={`landing-${k}`} color={layer.color} />
                  </GlassCard>
                </Link>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ── Assistant preview ────────────────────────────────────── */

export function AssistantPreview() {
  const dict = useDict();
  const locale = useLocale();
  const DEMO_EXCHANGE = [
    { role: "user", text: dict.assistant.demoUser },
    { role: "ai", text: dict.assistant.demoAi },
  ];
  return (
    <section className="max-w-6xl mx-auto px-6 pt-32">
      <div className="grid lg:grid-cols-2 gap-12 items-center">
        <Reveal>
          <GlassCard bright ticks className="p-6 sm:p-8 relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-line pb-4 mb-5">
              <div className="flex items-center gap-3">
                <span className="grid place-items-center w-8 h-8 rounded-lg bg-emerald/10 border border-emerald/30 text-emerald text-xs font-bold">
                  Æ
                </span>
                <span className="telemetry telemetry-bright">{dict.assistant.analyst}</span>
              </div>
              <span className="flex items-center gap-2">
                <span className="dot-live" />
                <span className="telemetry">{dict.assistant.reasoning}</span>
              </span>
            </div>
            <div className="flex flex-col gap-4">
              {DEMO_EXCHANGE.map((m, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 + i * 0.5, duration: 0.8 }}
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    m.role === "user"
                      ? "self-end bg-carbon-3 border border-line-bright"
                      : "self-start bg-emerald/[0.06] border border-emerald/20 text-ink-dim"
                  }`}
                >
                  {m.text}
                </motion.div>
              ))}
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 1.6 }}
                className="self-start flex gap-1.5 px-4 py-3"
              >
                {[0, 1, 2].map((i) => (
                  <motion.span
                    key={i}
                    animate={{ opacity: [0.2, 1, 0.2] }}
                    transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                    className="w-1.5 h-1.5 rounded-full bg-emerald"
                  />
                ))}
              </motion.div>
            </div>
          </GlassCard>
        </Reveal>

        <div className="flex flex-col items-start gap-7 lg:pl-6">
          <SectionHeading
            tag={dict.assistant.tag}
            title={
              <>
                {dict.assistant.titleA}
                <br />
                <span className="display-gradient">{dict.assistant.titleAccent}</span>
              </>
            }
            lede={dict.assistant.lede}
          />
          <Reveal index={3}>
            <GlowButton href={localePath("/assistant", locale)} variant="ghost">
              {dict.assistant.cta}
            </GlowButton>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ── Community strip ──────────────────────────────────────── */

const COMMUNITY_VALUES = ["31,408", "1,962", "412k"];

export function CommunityStrip() {
  const dict = useDict();
  const stats = COMMUNITY_VALUES.map((v, i) => ({
    v,
    l: dict.community.statLabels[i],
  }));
  return (
    <section className="max-w-6xl mx-auto px-6 pt-32">
      <Reveal>
        <GlassCard className="relative overflow-hidden p-8 sm:p-12">
          <div
            className="absolute inset-0 opacity-60"
            style={{
              background:
                "radial-gradient(ellipse 60% 90% at 85% 50%, rgba(45,226,166,0.08), transparent 60%)",
            }}
          />
          <div className="relative grid lg:grid-cols-[1.2fr_1fr] gap-10 items-center">
            <div className="flex flex-col items-start gap-5">
              <TelemetryTag tone="cyan">{dict.community.tag}</TelemetryTag>
              <h2 className="font-[family-name:var(--font-syne)] font-bold text-3xl sm:text-4xl leading-tight">
                {dict.community.titleA}
                <br />
                {dict.community.titleB}
              </h2>
              <p className="text-ink-dim font-light leading-relaxed max-w-md">
                {dict.community.lede}
              </p>
              <GlowButton href="/community" variant="ghost" className="mt-2">
                {dict.community.cta}
              </GlowButton>
            </div>
            <div className="flex flex-col gap-5">
              {stats.map((s, i) => (
                <Reveal key={s.l} index={i}>
                  <div className="flex items-baseline gap-4 border-b border-line pb-4">
                    <span className="readout text-2xl sm:text-3xl text-emerald">{s.v}</span>
                    <span className="telemetry">{s.l}</span>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </GlassCard>
      </Reveal>
    </section>
  );
}

/* ── Final CTA ────────────────────────────────────────────── */

export function FinalCta() {
  const dict = useDict();
  const locale = useLocale();
  return (
    <section className="relative max-w-4xl mx-auto px-6 pt-36 pb-10 text-center">
      <div
        className="absolute inset-x-0 top-10 h-[420px] -z-10 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 55% 60% at 50% 40%, rgba(45,226,166,0.09), transparent 65%)",
        }}
      />
      <SectionHeading
        align="center"
        tag={dict.finalCta.tag}
        title={
          <>
            {dict.finalCta.titleA}
            <br />
            <span className="display-gradient">{dict.finalCta.titleAccent}</span>
          </>
        }
        lede={dict.finalCta.lede}
      />
      <Reveal index={3} className="flex justify-center gap-4 mt-10 flex-wrap">
        <GlowButton href={localePath("/map", locale)}>{dict.finalCta.ctaAtlas}</GlowButton>
        <GlowButton href={localePath("/assistant", locale)} variant="ghost">
          {dict.finalCta.ctaAssistant}
        </GlowButton>
      </Reveal>
    </section>
  );
}
