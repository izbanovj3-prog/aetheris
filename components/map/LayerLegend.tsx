"use client";

import { memo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { LayerKey } from "@/lib/data";

/* Compact gradient legend for the active layer — gives the color field on the
   map a readable scale, reinforcing that markers encode a real measurement. */
export const LayerLegend = memo(function LayerLegend({
  layer,
  label,
  unit,
  ramp,
  domain,
}: {
  layer: LayerKey;
  label: string;
  unit: string;
  ramp: [string, string, string];
  domain: [number, number];
}) {
  const [lo, hi] = domain;
  const mid = Math.round((lo + hi) / 2);
  return (
    <div className="absolute left-3 sm:left-4 bottom-4 z-20 glass panel-glow rounded-xl px-3.5 py-2.5 w-[180px]">
      <AnimatePresence mode="wait">
        <motion.div
          key={layer}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-ink">{label}</span>
            <span className="telemetry !text-[8px]">{unit}</span>
          </div>
          <div
            className="h-2 rounded-full"
            style={{ background: `linear-gradient(90deg, ${ramp[0]}, ${ramp[1]}, ${ramp[2]})` }}
          />
          <div className="flex justify-between mt-1.5">
            <span className="readout text-[9px] text-ink-faint">{lo}</span>
            <span className="readout text-[9px] text-ink-faint">{mid}</span>
            <span className="readout text-[9px] text-ink-faint">{hi}</span>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
});
