"use client";

import { memo, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  basePulse,
  buildEvents,
  planetNarrative,
  severityColor,
  type AtlasEvent,
} from "@/lib/atlas";
import { OriginBadge } from "@/components/ui/primitives";
import { useDict, useLocale } from "@/lib/useLocale";

const TONE = (h: number) =>
  h >= 70 ? "#2de2a6" : h >= 50 ? "#4fd8f7" : h >= 35 ? "#f5b352" : "#f57362";

/* Model overview. Every number here comes from the simulation, so it is
   labelled as a model, holds still (no "live" drift), and carries no
   timestamps — a value that moves on a timer and says "2m ago" reads as
   a measurement, which none of these is. The list rotates slowly through
   notable modelled values; that is the only thing that changes. */
export const GlobalPulse = memo(function GlobalPulse({
  isDesktop,
}: {
  isDesktop: boolean;
}) {
  const dict = useDict();
  const locale = useLocale();
  const base = useMemo(() => basePulse(), []);
  const events = useMemo(() => buildEvents(locale), [locale]);
  const [head, setHead] = useState(0);
  const [open, setOpen] = useState(false); // mobile expand

  useEffect(() => {
    const feed = setInterval(() => setHead((h) => (h + 1) % events.length), 6000);
    return () => clearInterval(feed);
  }, [events.length]);

  const health = Math.round(base.health);
  const meanAqi = Math.round(base.meanAqi);
  const anomaly = base.anomaly;
  const color = TONE(health);

  const visible: AtlasEvent[] = Array.from({ length: isDesktop ? 4 : 3 }, (_, i) => events[(head + i) % events.length]);

  const ring = (size: number) => {
    const R = size / 2 - 5;
    const C = 2 * Math.PI * R;
    return (
      <svg viewBox={`0 0 ${size} ${size}`} className="-rotate-90" style={{ width: size, height: size }}>
        <circle cx={size / 2} cy={size / 2} r={R} fill="none" stroke="rgba(140,180,192,0.12)" strokeWidth="4" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={R}
          fill="none"
          stroke={color}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={C}
          strokeDashoffset={C * (1 - health / 100)}
          style={{ transition: "stroke-dashoffset 1.2s ease, stroke 1.2s", filter: `drop-shadow(0 0 5px ${color}66)` }}
        />
      </svg>
    );
  };

  /* ── mobile: compact chip that expands ── */
  if (!isDesktop) {
    return (
      <div className="absolute right-3 top-24 z-20 flex flex-col items-end gap-2">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label={dict.map.planetaryPulse}
          className="glass-bright panel-glow rounded-2xl pl-2 pr-3 py-2 flex items-center gap-2"
        >
          <span className="relative grid place-items-center w-9 h-9">
            {ring(36)}
            <span className="absolute readout text-[0.9375rem] font-medium" style={{ color }}>
              {health}
            </span>
          </span>
          <span className="flex flex-col items-start leading-tight">
            <span className="telemetry !text-[0.9375rem]">{dict.map.planet} · {dict.dataOrigin.modeled}</span>
            <span className="text-[0.9375rem] font-semibold text-ink">{dict.map.health}</span>
          </span>
        </button>
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="glass-bright panel-glow rounded-2xl p-3 w-[230px]"
            >
              <Feed visible={visible} head={head} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  /* ── desktop: full pulse panel ── */
  return (
    <motion.div
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.9, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="absolute right-4 top-24 z-20 w-[300px] glass-bright panel-glow rounded-2xl ticks overflow-hidden"
    >
      <div className="p-4 flex items-center gap-4 border-b border-line">
        <div className="relative grid place-items-center shrink-0">
          {ring(64)}
          <div className="absolute flex flex-col items-center">
            <span className="readout text-xl font-medium" style={{ color }}>
              {health}
            </span>
            <span className="telemetry !text-[0.9375rem] -mt-0.5">{dict.map.index}</span>
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <span className="telemetry">{dict.map.planetaryPulse}</span>
          <OriginBadge origin="modeled" className="self-start" />
          <p className="text-[0.9375rem] leading-snug text-ink-dim font-light">
            {planetNarrative({ ...base, health }, locale)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 divide-x divide-line border-b border-line">
        <Stat label={dict.map.pulseAqi} value={String(meanAqi)} tone="#4fd8f7" />
        <Stat label={dict.map.pulseAnomaly} value={`+${anomaly.toFixed(2)}°`} tone="#f5b352" />
        <Stat label={dict.map.pulseHotspots} value={String(base.hotspots)} tone="#f57362" />
      </div>

      <div className="p-3">
        <div className="telemetry mb-2 flex items-center justify-between">
          <span>{dict.map.feedTitle}</span>
          <span className="text-emerald/60">{dict.map.streaming}</span>
        </div>
        <Feed visible={visible} head={head} />
      </div>
    </motion.div>
  );
});

function Stat({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="px-3 py-2.5 flex flex-col gap-0.5">
      <span className="telemetry !text-[0.9375rem]">{label}</span>
      <span className="readout text-sm font-medium" style={{ color: tone, transition: "color 0.6s" }}>
        {value}
      </span>
    </div>
  );
}

function Feed({ visible, head }: { visible: AtlasEvent[]; head: number }) {
  return (
    <div className="flex flex-col gap-1.5">
      <AnimatePresence initial={false} mode="popLayout">
        {visible.map((e, i) => (
          <motion.div
            key={`${head}-${e.id}`}
            layout
            initial={i === 0 ? { opacity: 0, y: -8, height: 0 } : false}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="flex items-start gap-2.5 overflow-hidden"
          >
            <span
              className="mt-0.5 text-[0.9375rem] leading-none shrink-0"
              style={{ color: severityColor(e.severity) }}
            >
              {e.glyph}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[0.9375rem] font-semibold text-ink truncate">{e.place}</span>
              </div>
              <p className="text-[0.9375rem] leading-snug text-ink-faint font-light">
                {e.text}
              </p>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
