"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import { LAYER_ORIGIN, type LayerKey } from "@/lib/data";
import { EASE, OriginBadge } from "@/components/ui/primitives";

/* Compact gradient legend for the active layer — gives the color field on the
   map a readable scale, reinforcing that markers encode a real measurement. */
/** Second legend row for biodiversity: the live GBIF signal shown beside —
 *  never merged into — the modeled intactness index. */
export interface LiveLegendRow {
  label: string;
  /** Rendered value, or null while the request is in flight. */
  value: string | null;
  /** Shown instead of a value when no city has been picked yet. */
  hint: string;
}

export const LayerLegend = memo(function LayerLegend({
  layer,
  label,
  unit,
  ramp,
  domain,
  liveRow,
}: {
  layer: LayerKey;
  label: string;
  unit: string;
  ramp: [string, string, string];
  domain: [number, number];
  liveRow?: LiveLegendRow | null;
}) {
  const [lo, hi] = domain;
  const mid = Math.round((lo + hi) / 2);
  return (
    <div className="absolute left-3 sm:left-4 bottom-4 z-20 glass panel-glow rounded-xl px-3.5 py-2.5 w-[180px]">
      {/* `key={layer}` remounts this subtree the moment the layer state changes,
          so the label, badge and scale below are always the current layer's —
          no AnimatePresence, no exit animation, nothing to wait on.

          The previous `AnimatePresence mode="wait"` deliberately withheld the
          incoming element until the outgoing one finished exiting; when rAF is
          throttled (background tab, power saving, headless/non-compositing
          renderer) that exit never completed and the legend sat frozen on the
          old layer while the map showed the new one.

          The slide is cosmetic only. It animates transform, never opacity:
          a JS-driven fade would hold `opacity: 0` inline for as long as rAF is
          paused, which turns a stale legend into an invisible one. A stalled
          transform just leaves the panel a few pixels low — still fully legible,
          still the correct layer. */}
      <motion.div
        key={layer}
        initial={{ y: 5 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.28, ease: EASE }}
      >
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] font-semibold text-ink">{label}</span>
          <span className="telemetry !text-[8px]">{unit}</span>
        </div>
        <div className="mb-2">
          <OriginBadge origin={LAYER_ORIGIN[layer]} />
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

        {/* Biodiversity carries two independent readings. They get two rows
            and two badges — merging them into one number would imply the
            modeled index had become live, which it has not. The row above
            stays the modeled BII scale; this one is the GBIF signal. */}
        {liveRow && (
          <div className="mt-2.5 pt-2.5 border-t border-line flex flex-col gap-1.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-semibold text-ink leading-tight">
                {liveRow.label}
              </span>
              <OriginBadge origin="live" />
            </div>
            {liveRow.value ? (
              <span className="readout text-[11px] text-emerald">{liveRow.value}</span>
            ) : (
              <span className="telemetry !text-[8px] leading-snug">{liveRow.hint}</span>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
});
