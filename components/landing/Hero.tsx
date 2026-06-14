"use client";

import dynamic from "next/dynamic";
import { motion, useScroll, useTransform } from "framer-motion";
import { useMemo, useRef } from "react";
import { EASE, GlowButton, TelemetryTag } from "@/components/ui/primitives";
import { HOTSPOTS, getStations, planetSummary } from "@/lib/data";

const Globe = dynamic(() => import("./Globe"), { ssr: false });

const heroStagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.14, delayChildren: 0.2 } },
};

const heroItem = {
  hidden: { opacity: 0, y: 34, filter: "blur(6px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 1.1, ease: EASE },
  },
};

const CHIP_META = [
  { key: "aqi", label: "Mean AQI · Network", tone: "text-cyan", pos: "top-[16%] right-[4%] lg:right-[8%]", delay: 1.2 },
  { key: "anomaly", label: "Temp anomaly", tone: "text-amber", pos: "top-[46%] right-[-2%] lg:right-[2%]", delay: 1.5 },
  { key: "hotspots", label: "Environmental hotspots", tone: "text-coral", pos: "bottom-[18%] right-[10%] lg:right-[16%]", delay: 1.8 },
] as const;

export function Hero() {
  const ref = useRef<HTMLDivElement>(null);
  // Derive the floating readouts from the same seeded model the Atlas and
  // dashboard use, so every surface reports identical planetary vitals.
  const chipValues = useMemo<Record<string, string>>(() => {
    const sum = planetSummary(getStations());
    return {
      aqi: String(sum.meanAqi),
      anomaly: `+${sum.meanAnomaly.toFixed(2)} °C`,
      hotspots: String(HOTSPOTS.length).padStart(2, "0"),
    };
  }, []);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const globeY = useTransform(scrollYProgress, [0, 1], [0, 140]);
  const globeOpacity = useTransform(scrollYProgress, [0, 0.85], [1, 0.15]);
  const textY = useTransform(scrollYProgress, [0, 1], [0, -60]);

  return (
    <section
      ref={ref}
      className="relative min-h-[100svh] flex items-center overflow-hidden"
    >
      {/* globe — right hemisphere, bleeding off-canvas */}
      <motion.div
        style={{ y: globeY, opacity: globeOpacity }}
        className="absolute inset-y-0 right-[-30%] sm:right-[-18%] lg:right-[-8%] w-[110%] sm:w-[80%] lg:w-[62%] pointer-events-none lg:pointer-events-auto"
      >
        <Globe className="w-full h-full" />
      </motion.div>

      {/* floating telemetry chips over the globe */}
      <div className="absolute inset-0 hidden lg:block pointer-events-none">
        {CHIP_META.map((c) => (
          <motion.div
            key={c.key}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: c.delay, ease: EASE }}
            className={`absolute ${c.pos} glass rounded-xl px-4 py-3 ticks`}
          >
            <div className="telemetry mb-1">{c.label}</div>
            <div className={`readout text-lg font-medium ${c.tone}`}>
              {chipValues[c.key]}
            </div>
          </motion.div>
        ))}
      </div>

      {/* copy */}
      <motion.div
        style={{ y: textY }}
        className="relative z-10 max-w-6xl mx-auto px-6 w-full pt-28 pb-20"
      >
        <motion.div
          variants={heroStagger}
          initial="hidden"
          animate="show"
          className="max-w-2xl flex flex-col items-start gap-7"
        >
          <motion.div variants={heroItem}>
            <TelemetryTag tone="emerald">
              <span className="dot-live" />
              Planetary sensor network · online
            </TelemetryTag>
          </motion.div>

          <motion.h1
            variants={heroItem}
            className="font-[family-name:var(--font-syne)] font-extrabold tracking-tight leading-[1.02] text-[2.75rem] sm:text-6xl lg:text-7xl"
          >
            The operating
            <br />
            system for{" "}
            <span className="display-gradient">Kazakhstan.</span>
          </motion.h1>

          <motion.p
            variants={heroItem}
            className="text-ink-dim text-lg sm:text-xl font-light leading-relaxed max-w-lg"
          >
            Aetheris fuses satellites, ground stations, and AI into a single
            living picture of Kazakhstan — air, water, industry, and ecology,
            across every region in real time.
          </motion.p>

          <motion.div
            variants={heroItem}
            className="flex flex-wrap items-center gap-4 mt-2"
          >
            <GlowButton href="/map">Open the Atlas</GlowButton>
            <GlowButton href="/dashboard" variant="ghost">
              View intelligence
            </GlowButton>
          </motion.div>

          <motion.div
            variants={heroItem}
            className="flex items-center gap-6 mt-6 text-ink-faint"
          >
            <span className="telemetry">28 cities · 17 regions</span>
            <span className="w-px h-3 bg-line-bright" />
            <span className="telemetry">5 environmental layers</span>
            <span className="w-px h-3 bg-line-bright" />
            <span className="telemetry hidden sm:inline">14.2B datapoints / day</span>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* scroll cue */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.4, duration: 1 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3"
      >
        <span className="telemetry">Descend</span>
        <motion.span
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
          className="block w-px h-10 bg-gradient-to-b from-emerald/70 to-transparent"
        />
      </motion.div>
    </section>
  );
}
