"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { EASE } from "@/components/ui/primitives";
import type { AiContext } from "@/lib/aiContext";

/* ─────────────────────────────────────────────────────────────
   AI-контекст bubble — concept section 1.2, collapsed by default and
   sitting under the photo on the report card.

   The framing is fixed and is the reason this component exists at all
   rather than the text being dropped into the card body: the header says
   "контекст, не вердикт" every single time, above every reading, so no
   number in here can be skim-read as the platform ruling on the report.

   Not built, and not stubbed: any suggestion that a photo was compared
   against satellite imagery. The concept is explicit that the project has
   no access to commercial archives at the resolution and revisit rate
   that would take, and a placeholder implying it exists would be worse
   than not having it. What is here is what is really available — the
   nearest live air-quality station, or the GBIF occurrence record.
   ───────────────────────────────────────────────────────────── */

export function AiContextBubble({
  context,
  loading,
}: {
  context: AiContext | null;
  loading: boolean;
}) {
  const [open, setOpen] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center gap-2.5 rounded-xl border border-line bg-carbon-2/40 px-3.5 py-2.5 mb-4">
        <span className="grid place-items-center w-5 h-5 rounded-md bg-emerald/10 border border-emerald/25 text-emerald text-[9px] font-bold shrink-0">
          Æ
        </span>
        <span className="telemetry !text-[9px]">Analyst is pulling comparable data…</span>
      </div>
    );
  }

  if (!context) return null;

  const noSource = context.kind === "none";

  return (
    <div
      className={`rounded-xl border mb-4 overflow-hidden ${
        noSource ? "border-line bg-carbon-2/40" : "border-emerald/25 bg-emerald/[0.04]"
      }`}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-left hover:bg-ink/[0.02] transition-colors"
      >
        <span
          className={`grid place-items-center w-5 h-5 rounded-md text-[9px] font-bold shrink-0 border ${
            noSource
              ? "bg-carbon-3 border-line-bright text-ink-faint"
              : "bg-emerald/10 border-emerald/25 text-emerald"
          }`}
          aria-hidden
        >
          Æ
        </span>
        <span className="min-w-0 flex-1">
          <span className={`telemetry !text-[9px] ${noSource ? "" : "text-emerald/80"}`}>
            AI-контекст
          </span>
          <span className="block text-[11px] text-ink-faint font-light mt-0.5">
            Context, not a verdict — {noSource ? "no live source for this category" : "a reading from beside the report"}
          </span>
        </span>
        <svg
          viewBox="0 0 16 16"
          className={`w-3.5 h-3.5 text-ink-faint shrink-0 transition-transform duration-300 ${open ? "rotate-180" : ""}`}
          fill="none"
          aria-hidden
        >
          <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.32, ease: EASE }}
            className="overflow-hidden"
          >
            <div className="px-3.5 pb-3.5 pt-0.5 flex flex-col gap-2.5 border-t border-line/60">
              <p className="text-[12.5px] text-ink-dim font-light leading-relaxed pt-3">
                {context.text}
              </p>

              {!noSource && (
                <p className="text-[11px] text-ink-faint font-light leading-relaxed">
                  This reading was taken when this page loaded, not when the report
                  was filed. For a report from the last hour those are close to the
                  same thing; for an older one they are not.
                </p>
              )}

              <div className="telemetry !text-[8.5px] border-t border-line/60 pt-2.5 leading-relaxed">
                ⌖ {context.source}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
