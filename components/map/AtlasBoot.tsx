"use client";

import { memo, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

/* Progressive boot sequence shown over the map until the first frame is ready.
   Pure SVG/CSS — unmounts on reveal, so it costs nothing once the map is live. */

const LINES = [
  "Establishing satellite uplink",
  "Synchronising 28 regional stations",
  "Calibrating AQI · PM2.5 · PM10 grid",
  "Loading industrial emission feed",
  "Resolving biodiversity index",
  "Rendering Kazakhstan surface",
];

export const AtlasBoot = memo(function AtlasBoot({
  ready,
  reducedMotion,
  onDone,
}: {
  ready: boolean;
  reducedMotion: boolean;
  onDone: () => void;
}) {
  const [step, setStep] = useState(0);
  const [pct, setPct] = useState(4);
  const doneRef = useRef(false);

  // stream the boot log
  useEffect(() => {
    if (reducedMotion) {
      setStep(LINES.length);
      setPct(100);
      return;
    }
    const id = setInterval(() => {
      setStep((s) => Math.min(s + 1, LINES.length));
    }, 300);
    return () => clearInterval(id);
  }, [reducedMotion]);

  // progress climbs toward 92% on its own, completes when the map is ready
  useEffect(() => {
    if (reducedMotion) return;
    const id = setInterval(() => {
      setPct((p) => (p < 92 ? p + Math.max(1, Math.round((92 - p) * 0.12)) : p));
    }, 160);
    return () => clearInterval(id);
  }, [reducedMotion]);

  // reveal once the log has streamed AND the map signalled ready
  useEffect(() => {
    if (doneRef.current) return;
    const streamed = step >= LINES.length;
    if (ready && streamed) {
      doneRef.current = true;
      setPct(100);
      const t = setTimeout(onDone, reducedMotion ? 0 : 520);
      return () => clearTimeout(t);
    }
  }, [ready, step, reducedMotion, onDone]);

  return (
    <motion.div
      exit={{ opacity: 0, scale: 1.04, filter: "blur(8px)" }}
      transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
      className="absolute inset-0 z-40 grid place-items-center bg-abyss overflow-hidden"
      role="status"
      aria-live="polite"
      aria-label="Loading the global environmental map"
    >
      {/* faint moving starfield/grid wash */}
      <div
        data-atlas-fx
        className="absolute inset-0 opacity-[0.5]"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 45%, rgba(79,157,222,0.10), transparent 60%)",
          animation: reducedMotion ? "none" : "glow-breathe 5s ease-in-out infinite",
        }}
      />

      <div className="relative flex flex-col items-center gap-8 px-6">
        {/* planetary scope */}
        <div className="relative w-[230px] h-[230px]">
          {/* radar sweep */}
          <div
            data-atlas-fx
            className="absolute inset-0 rounded-full"
            style={{
              background:
                "conic-gradient(from 0deg, rgba(45,226,166,0.0) 0deg, rgba(45,226,166,0.0) 300deg, rgba(45,226,166,0.28) 355deg, rgba(45,226,166,0.5) 360deg)",
              mask: "radial-gradient(circle, transparent 0, black 1px)",
              WebkitMask: "radial-gradient(circle, transparent 0, black 1px)",
              animation: reducedMotion ? "none" : "radar-sweep 3.4s linear infinite",
            }}
          />
          <svg viewBox="0 0 230 230" className="absolute inset-0 w-full h-full" aria-hidden>
            <defs>
              <radialGradient id="boot-core" cx="42%" cy="38%" r="70%">
                <stop offset="0%" stopColor="rgba(45,226,166,0.18)" />
                <stop offset="55%" stopColor="rgba(79,216,247,0.06)" />
                <stop offset="100%" stopColor="rgba(0,0,0,0)" />
              </radialGradient>
            </defs>
            <circle cx="115" cy="115" r="108" fill="url(#boot-core)" />
            {/* graticule rings */}
            {[40, 70, 100].map((r) => (
              <circle
                key={r}
                cx="115"
                cy="115"
                r={r}
                fill="none"
                stroke="rgba(140,200,210,0.16)"
                strokeWidth="1"
              />
            ))}
            {/* meridians (ellipses) */}
            {[30, 60, 90].map((rx) => (
              <ellipse
                key={rx}
                cx="115"
                cy="115"
                rx={rx}
                ry="100"
                fill="none"
                stroke="rgba(140,200,210,0.1)"
                strokeWidth="1"
              />
            ))}
            <line x1="115" y1="7" x2="115" y2="223" stroke="rgba(140,200,210,0.12)" strokeWidth="1" />
            <line x1="7" y1="115" x2="223" y2="115" stroke="rgba(140,200,210,0.12)" strokeWidth="1" />
            {/* station blips lighting up with progress */}
            {BLIPS.map((b, i) => (
              <circle
                key={i}
                cx={b[0]}
                cy={b[1]}
                r="2.4"
                fill={i / BLIPS.length < pct / 100 ? "#2de2a6" : "rgba(140,200,210,0.18)"}
                style={{
                  filter:
                    i / BLIPS.length < pct / 100
                      ? "drop-shadow(0 0 4px rgba(45,226,166,0.9))"
                      : "none",
                  transition: "fill 0.4s, filter 0.4s",
                }}
              />
            ))}
          </svg>
          {/* centre readout */}
          <div className="absolute inset-0 grid place-items-center">
            <div className="readout text-4xl font-medium text-emerald tabular-nums">
              {pct}
              <span className="text-lg">%</span>
            </div>
          </div>
        </div>

        {/* wordmark + progress */}
        <div className="flex flex-col items-center gap-3 w-[260px]">
          <span className="telemetry telemetry-bright tracking-[0.3em]">
            AETHERIS · KAZAKHSTAN ATLAS
          </span>
          <div className="h-px w-full bg-carbon-3 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald to-cyan origin-left"
              style={{ transform: `scaleX(${pct / 100})`, transition: "transform 0.25s ease-out" }}
            />
          </div>
        </div>

        {/* streaming boot log */}
        <div className="flex flex-col gap-1.5 w-[260px] min-h-[120px]">
          {LINES.map((line, i) => {
            const shown = i < step;
            const active = i === step - 1 && !(ready && step >= LINES.length);
            return (
              <div
                key={line}
                className="flex items-center gap-2.5 text-[11px]"
                style={{
                  opacity: shown ? 1 : 0.25,
                  transition: "opacity 0.35s",
                }}
              >
                <span
                  className={`grid place-items-center w-3.5 h-3.5 rounded-full text-[8px] ${
                    shown && !active
                      ? "text-emerald"
                      : active
                        ? "text-cyan"
                        : "text-ink-faint"
                  }`}
                >
                  {shown && !active ? "✓" : active ? "◌" : "·"}
                </span>
                <span
                  className={`readout tracking-wide ${shown ? "text-ink-dim" : "text-ink-faint"}`}
                >
                  {line}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
});

// scattered "station" positions inside the scope (precomputed, deterministic)
const BLIPS: Array<[number, number]> = [
  [78, 86], [142, 70], [165, 120], [96, 150], [120, 100],
  [60, 120], [180, 96], [110, 60], [150, 160], [86, 116],
  [130, 140], [70, 150], [160, 64], [104, 178], [188, 130],
];
