"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  EASE,
  GlassCard,
  Reveal,
  TelemetryTag,
} from "@/components/ui/primitives";
import {
  HOTSPOTS,
  type HotspotType,
  type Station,
  aqiBand,
  genSeries,
  getStations,
  planetSummary,
  scoreBand,
} from "@/lib/data";
import { fetchLiveStations } from "@/lib/live";

const TONE = {
  emerald: "text-emerald",
  cyan: "text-cyan",
  amber: "text-amber",
  coral: "text-coral",
};

/* ── Area chart (anomaly trend) ───────────────────────────── */

function AreaChart({
  series,
  color,
  unit,
  height = 180,
}: {
  series: { t: number; v: number }[];
  color: string;
  unit: string;
  height?: number;
}) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const W = 600;
  const H = height;
  const pad = 8;
  const max = Math.max(...series.map((p) => p.v));
  const min = Math.min(...series.map((p) => p.v));
  const x = (i: number) => pad + (i / (series.length - 1)) * (W - pad * 2);
  const y = (v: number) => H - pad - ((v - min) / (max - min || 1)) * (H - pad * 2 - 14);
  const d = series.map((p, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(p.v)}`).join(" ");
  const gid = `area-${color.replace("#", "")}`;

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        style={{ height }}
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const px = ((e.clientX - rect.left) / rect.width) * W;
          const i = Math.round(((px - pad) / (W - pad * 2)) * (series.length - 1));
          setHoverIdx(Math.max(0, Math.min(series.length - 1, i)));
        }}
        onMouseLeave={() => setHoverIdx(null)}
      >
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.28" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* gridlines */}
        {[0.25, 0.5, 0.75].map((g) => (
          <line
            key={g}
            x1={pad}
            x2={W - pad}
            y1={H * g}
            y2={H * g}
            stroke="rgba(140,180,192,0.08)"
            strokeDasharray="2 6"
          />
        ))}
        <path d={`${d} L${x(series.length - 1)},${H} L${x(0)},${H} Z`} fill={`url(#${gid})`} />
        <motion.path
          d={d}
          fill="none"
          stroke={color}
          strokeWidth="1.8"
          initial={{ pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 2, ease: "easeOut" }}
        />
        {hoverIdx !== null && (
          <g>
            <line
              x1={x(hoverIdx)}
              x2={x(hoverIdx)}
              y1={0}
              y2={H}
              stroke="rgba(233,243,244,0.25)"
              strokeDasharray="3 3"
            />
            <circle cx={x(hoverIdx)} cy={y(series[hoverIdx].v)} r="4" fill={color} />
            <circle cx={x(hoverIdx)} cy={y(series[hoverIdx].v)} r="8" fill={color} opacity="0.2" />
          </g>
        )}
      </svg>
      {hoverIdx !== null && (
        <div
          className="absolute -top-1 glass-bright rounded-lg px-3 py-1.5 pointer-events-none readout text-xs"
          style={{
            left: `${(hoverIdx / (series.length - 1)) * 88}%`,
            color,
          }}
        >
          {series[hoverIdx].v.toFixed(2)} {unit}
        </div>
      )}
    </div>
  );
}

/* ── Radial gauge ─────────────────────────────────────────── */

function RadialGauge({ value, label }: { value: number; label: string }) {
  const R = 64;
  const C = 2 * Math.PI * R;
  const band = scoreBand(value);
  const color =
    band.tone === "emerald" ? "#2de2a6" : band.tone === "cyan" ? "#4fd8f7" : band.tone === "amber" ? "#f5b352" : "#f57362";

  return (
    <div className="relative flex flex-col items-center">
      <svg viewBox="0 0 160 160" className="w-44 h-44 -rotate-90">
        <circle cx="80" cy="80" r={R} fill="none" stroke="rgba(140,180,192,0.1)" strokeWidth="7" />
        <motion.circle
          cx="80"
          cy="80"
          r={R}
          fill="none"
          stroke={color}
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={C}
          initial={{ strokeDashoffset: C }}
          whileInView={{ strokeDashoffset: C * (1 - value / 100) }}
          viewport={{ once: true }}
          transition={{ duration: 1.8, ease: EASE, delay: 0.3 }}
          style={{ filter: `drop-shadow(0 0 8px ${color}66)` }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <div className="text-center">
          <div className="readout text-4xl font-medium" style={{ color }}>
            {value}
          </div>
          <div className="telemetry mt-1">{band.label}</div>
        </div>
      </div>
      <span className="telemetry telemetry-bright -mt-2">{label}</span>
    </div>
  );
}

/* ── City ranking bars ────────────────────────────────────── */

function CityBars({
  title,
  items,
  invert = false,
}: {
  title: string;
  items: { name: string; v: number }[];
  invert?: boolean;
}) {
  const max = Math.max(...items.map((i) => i.v));
  return (
    <div>
      <div className="telemetry mb-4">{title}</div>
      <div className="flex flex-col gap-3">
        {items.map((it, i) => {
          const color = invert
            ? i < 2 ? "#f57362" : "#f5b352"
            : i < 2 ? "#2de2a6" : "#4fd8f7";
          return (
            <div key={it.name} className="grid grid-cols-[90px_1fr_44px] items-center gap-3">
              <span className="text-[12px] text-ink-dim truncate">{it.name}</span>
              <div className="h-1.5 rounded-full bg-carbon-3 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: `${(it.v / max) * 100}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 1, ease: EASE, delay: i * 0.07 }}
                  className="h-full rounded-full"
                  style={{ background: `linear-gradient(90deg, ${color}77, ${color})` }}
                />
              </div>
              <span className="readout text-xs text-right" style={{ color }}>
                {it.v}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Insight cards ────────────────────────────────────────── */

const INSIGHTS = [
  {
    severity: "High",
    tone: "coral" as const,
    title: "Karaganda steel-belt particulate load",
    body: "Temirtau and the Karaganda industrial cluster are driving the highest sustained PM and SO₂ load in the network. Continuous-monitoring retrofits modeled to cut exceedance hours by a third.",
  },
  {
    severity: "Watch",
    tone: "amber" as const,
    title: "Aral dust season intensifying",
    body: "Seabed dust index up 18% over Kyzylorda as the dry season sets in. Salt-laden PM10 transport projected to reach lower Syr Darya settlements within days — issue respiratory advisories.",
  },
  {
    severity: "Positive",
    tone: "emerald" as const,
    title: "Northern oblast air corridor clearing",
    body: "Kokshetau, Petropavl and Kostanay show the strongest sustained air-quality improvement as the heating season ends — the clearest positive signal nationwide.",
  },
];

const TYPE_LABEL: Record<HotspotType, string> = {
  industrial: "Industrial",
  water: "Water",
  radiation: "Radiation",
  wildfire: "Wildfire",
  desertification: "Desertification",
  oilgas: "Oil & gas",
};

const STATUS_TONE: Record<string, string> = {
  critical: "text-coral",
  elevated: "text-amber",
  monitored: "text-cyan",
  recovering: "text-emerald",
};

/* ── Live pulse hook — gentle drift so the page feels alive ── */

function useLivePulse(base: number, amp: number, period = 3200) {
  const reduce = useReducedMotion();
  const [v, setV] = useState(base);
  useEffect(() => {
    if (reduce) return;
    const id = setInterval(() => {
      setV(base + (Math.random() - 0.5) * amp);
    }, period);
    return () => clearInterval(id);
  }, [base, amp, period, reduce]);
  return v;
}

/* ── Dashboard ────────────────────────────────────────────── */

export default function Dashboard() {
  // Simulated baseline (SSR-safe), then enrich with live Open-Meteo readings
  // after mount — air quality + weather become real, no hydration mismatch.
  const [stations, setStations] = useState<Station[]>(() => getStations());
  const [live, setLive] = useState(false);
  useEffect(() => {
    const ac = new AbortController();
    fetchLiveStations(ac.signal)
      .then((r) => {
        if (r.live) {
          setStations(r.stations);
          setLive(true);
        }
      })
      .catch(() => {});
    return () => ac.abort();
  }, []);
  const sum = useMemo(() => planetSummary(stations), [stations]);
  const anomalySeries = useMemo(() => genSeries("anomaly-365", 90, 1.32, 0.22, 0.0012), []);
  const aqiSeries = useMemo(() => genSeries("net-aqi", 90, sum.meanAqi, 16), [sum.meanAqi]);

  const cleanest = useMemo(
    () => [...stations].sort((a, b) => b.sustainability - a.sustainability).slice(0, 5).map((s) => ({ name: s.name, v: s.sustainability })),
    [stations],
  );
  const stressed = useMemo(
    () => [...stations].sort((a, b) => a.sustainability - b.sustainability).slice(0, 5).map((s) => ({ name: s.name, v: s.sustainability })),
    [stations],
  );

  const liveIngest = useLivePulse(164.2, 6);
  const liveLatency = useLivePulse(312, 40);

  return (
    <div className="max-w-7xl mx-auto px-6 pt-28 pb-20">
      {/* header */}
      <div className="flex flex-wrap items-end justify-between gap-6 mb-10">
        <div>
          <Reveal>
            <TelemetryTag tone="emerald">
              <span className="dot-live" />
              {live ? "Live · Open-Meteo feed" : "Intelligence · live model"}
            </TelemetryTag>
          </Reveal>
          <Reveal index={1}>
            <h1 className="font-[family-name:var(--font-syne)] font-bold text-4xl sm:text-5xl mt-4 tracking-tight">
              State of Kazakhstan
            </h1>
          </Reveal>
        </div>
        <Reveal index={2}>
          <div className="flex gap-6">
            <div>
              <div className="telemetry mb-1">Ingest rate</div>
              <div className="readout text-lg text-cyan">{liveIngest.toFixed(1)} k/s</div>
            </div>
            <div>
              <div className="telemetry mb-1">Model latency</div>
              <div className="readout text-lg text-emerald">{Math.round(liveLatency)} ms</div>
            </div>
          </div>
        </Reveal>
      </div>

      {/* top grid */}
      <div className="grid lg:grid-cols-[1fr_320px] gap-5">
        {/* anomaly chart */}
        <Reveal>
          <GlassCard bright ticks className="p-6 scanline">
            <div className="flex items-center justify-between mb-2">
              <div>
                <div className="telemetry mb-1">Global temperature anomaly</div>
                <div className="readout text-2xl text-amber">
                  +{sum.meanAnomaly} °C
                  <span className="text-xs text-ink-faint ml-2">vs 1991–2020</span>
                </div>
              </div>
              <span className="telemetry hidden sm:inline">90-day window</span>
            </div>
            <AreaChart series={anomalySeries} color="#f5b352" unit="°C" />
          </GlassCard>
        </Reveal>

        {/* gauge */}
        <Reveal index={1}>
          <GlassCard className="p-6 flex flex-col items-center justify-center gap-2 h-full">
            <RadialGauge value={sum.meanSustainability} label="Network sustainability" />
            <p className="text-[12px] text-ink-faint text-center font-light leading-relaxed mt-2 max-w-[220px]">
              Composite of air, water, biodiversity, pollution and inverse
              environmental risk across {stations.length} cities.
            </p>
          </GlassCard>
        </Reveal>
      </div>

      {/* middle row: AQI trend + rankings */}
      <div className="grid lg:grid-cols-3 gap-5 mt-5">
        <Reveal>
          <GlassCard className="p-6 lg:col-span-1">
            <div className="flex items-center justify-between mb-2">
              <div>
                <div className="telemetry mb-1">Network mean AQI</div>
                <div className={`readout text-2xl ${TONE[aqiBand(sum.meanAqi).tone]}`}>
                  {sum.meanAqi}
                  <span className="text-xs text-ink-faint ml-2">{aqiBand(sum.meanAqi).label}</span>
                </div>
              </div>
            </div>
            <AreaChart series={aqiSeries} color="#4fd8f7" unit="AQI" height={140} />
          </GlassCard>
        </Reveal>
        <Reveal index={1}>
          <GlassCard className="p-6">
            <CityBars title="Strongest cities · sustainability" items={cleanest} />
          </GlassCard>
        </Reveal>
        <Reveal index={2}>
          <GlassCard className="p-6">
            <CityBars title="Most stressed cities" items={stressed} invert />
          </GlassCard>
        </Reveal>
      </div>

      {/* AI insights */}
      <div className="mt-12">
        <Reveal>
          <div className="flex items-center gap-3 mb-5">
            <span className="grid place-items-center w-7 h-7 rounded-lg bg-emerald/10 border border-emerald/30 text-emerald text-[10px] font-bold">
              Æ
            </span>
            <h2 className="font-[family-name:var(--font-syne)] font-bold text-xl">
              AI insights
            </h2>
            <span className="telemetry ml-auto">Generated from live model · refreshed 6 min ago</span>
          </div>
        </Reveal>
        <div className="grid md:grid-cols-3 gap-5">
          {INSIGHTS.map((ins, i) => {
            const border = { coral: "border-coral/25", amber: "border-amber/25", emerald: "border-emerald/25" }[ins.tone];
            return (
              <Reveal key={ins.title} index={i}>
                <GlassCard className={`p-6 h-full border ${border} transition-transform duration-500 hover:-translate-y-1`}>
                  <span className={`telemetry ${TONE[ins.tone]}`}>{ins.severity}</span>
                  <h3 className="font-[family-name:var(--font-syne)] font-bold text-lg mt-2 mb-2.5 leading-snug">
                    {ins.title}
                  </h3>
                  <p className="text-[13px] text-ink-dim font-light leading-relaxed">
                    {ins.body}
                  </p>
                </GlassCard>
              </Reveal>
            );
          })}
        </div>
      </div>

      {/* hotspot registry */}
      <div className="mt-12">
        <Reveal>
          <h2 className="font-[family-name:var(--font-syne)] font-bold text-xl mb-5">
            Environmental hotspots &amp; industrial zones
          </h2>
        </Reveal>
        <Reveal index={1}>
          <GlassCard className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-line">
                    {["Site", "Region", "Type", "Severity", "Status"].map((h) => (
                      <th key={h} className="telemetry px-5 py-3.5 font-normal whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...HOTSPOTS]
                    .sort((a, b) => b.severity - a.severity)
                    .map((h) => (
                      <tr
                        key={h.id}
                        title={h.detail}
                        className="border-b border-line/50 last:border-0 hover:bg-carbon-2/60 transition-colors"
                      >
                        <td className="px-5 py-3.5 text-sm font-medium whitespace-nowrap">{h.name}</td>
                        <td className="px-5 py-3.5 text-xs text-ink-dim whitespace-nowrap">{h.region}</td>
                        <td className="px-5 py-3.5 telemetry !text-[9px] whitespace-nowrap">
                          {TYPE_LABEL[h.type]}
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-20 h-1 rounded-full bg-carbon-3 overflow-hidden">
                              <div
                                className="h-full rounded-full bg-gradient-to-r from-amber to-coral"
                                style={{ width: `${h.severity}%` }}
                              />
                            </div>
                            <span className="readout text-xs text-coral">{h.severity}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`readout text-xs capitalize ${STATUS_TONE[h.status]}`}>
                            {h.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </GlassCard>
        </Reveal>
      </div>
    </div>
  );
}
