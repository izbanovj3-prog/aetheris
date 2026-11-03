"use client";

import { STATUS_META, type ReportStatus, type Tone } from "@/lib/reports";
import { useCommunityText } from "@/lib/useLocale";

/* ─────────────────────────────────────────────────────────────
   The status chip — concept section 1.3, and the UI component the
   concept's own summary calls "Status Chip · цветной чип с 5 состояниями".

   The visible label is the status name exactly as the concept writes it.
   The English reading sits in the tooltip alongside the explanation, so
   nothing is paraphrased away and an English reader still gets the
   meaning without a second UI language competing for the chip.

   The numeral is not decoration: these five are a sequence, and a reader
   seeing ① on one card and ③ on another should be able to tell which is
   further along without knowing the vocabulary.
   ───────────────────────────────────────────────────────────── */

const TONE_CHIP: Record<Tone, string> = {
  emerald: "text-emerald border-emerald/30 bg-emerald/[0.06]",
  cyan: "text-cyan border-cyan/30 bg-cyan/[0.06]",
  amber: "text-amber border-amber/30 bg-amber/[0.06]",
  coral: "text-coral border-coral/30 bg-coral/[0.06]",
  atmos: "text-atmos border-atmos/30 bg-atmos/[0.06]",
};

const NUMERALS = ["①", "②", "③", "④", "⑤"];

export function StatusChip({ status }: { status: ReportStatus }) {
  const meta = STATUS_META[status];
  const text = useCommunityText().statuses[status];
  return (
    <span
      title={`${text.label} — ${text.gloss}. ${text.note}`}
      className={`telemetry !text-[0.9375rem] !tracking-[0.12em] border rounded-full px-2.5 py-1 inline-flex items-center gap-1.5 cursor-help ${TONE_CHIP[meta.tone]}`}
    >
      <span aria-hidden>{NUMERALS[meta.step - 1]}</span>
      <span>{text.label}</span>
      <span className="sr-only"> — {text.gloss}. {text.note}</span>
    </span>
  );
}

/* The five statuses, spelled out once on the page. A vocabulary this
   deliberate — and in particular the absence of "verified" and "resolved"
   from it — is worth stating openly rather than leaving to be inferred
   from whichever chips happen to be on screen. */
export function StatusLegend() {
  const t = useCommunityText();
  return (
    <div className="glass rounded-xl p-4 flex flex-col gap-3">
      <div className="telemetry">{t.legend.title}</div>
      <ol className="flex flex-col gap-2.5">
        {(Object.keys(STATUS_META) as ReportStatus[])
          .sort((a, b) => STATUS_META[a].step - STATUS_META[b].step)
          .map((s) => {
            const m = STATUS_META[s];
            return (
              <li key={s} className="flex items-start gap-2.5">
                <span className={`text-[0.9375rem] leading-5 shrink-0 ${TONE_CHIP[m.tone].split(" ")[0]}`} aria-hidden>
                  {NUMERALS[m.step - 1]}
                </span>
                <span className="min-w-0">
                  <span className="block text-[0.9375rem] text-ink leading-snug">{t.statuses[s].label}</span>
                  <span className="block telemetry !text-[0.9375rem] mt-0.5">{t.statuses[s].gloss}</span>
                </span>
              </li>
            );
          })}
      </ol>
      <p className="text-[0.9375rem] text-ink-faint font-light leading-relaxed border-t border-line pt-3">
        {t.legend.note}
      </p>
    </div>
  );
}
