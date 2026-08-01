"use client";

import { GlassCard, SourceNote } from "@/components/ui/primitives";
import {
  POINTS,
  RANKS,
  badgeProgress,
  computePoints,
  rankFor,
} from "@/lib/points";
import type { Report } from "@/lib/reports";

/* ─────────────────────────────────────────────────────────────
   Eco-Points, rank and the geographic badges — concept 2.1 and 2.2.

   Everything on this panel is computed from the reports this device has
   actually filed. When that is none, it shows zero and says so, rather
   than showing an illustrative profile with someone's imagined score on
   it. A progress display that starts by lying about your progress is
   worth less than an empty one.

   "Eco-Points", never "tokens" — see the header of lib/points.ts for why
   that is a constraint and not a preference.
   ───────────────────────────────────────────────────────────── */

export function BadgeShowcase({ reports }: { reports: Report[] }) {
  const points = computePoints(reports);
  const { rank, next, progress, toNext } = rankFor(points.total);
  const badges = badgeProgress(reports);
  const earned = badges.filter((b) => b.earned).length;

  return (
    <GlassCard bright className="p-5 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="telemetry mb-1">Eco-Points</div>
          <div className="readout text-3xl text-emerald leading-none">{points.total}</div>
        </div>
        <div className="text-right">
          <div className="telemetry mb-1">Rank</div>
          <div
            title={rank.docName ? `Written «${rank.docName}» in the Community 2.0 concept.` : undefined}
            className={`font-[family-name:var(--font-syne)] font-bold text-lg leading-none ${
              rank.docName ? "cursor-help" : ""
            }`}
          >
            {rank.name}
          </div>
        </div>
      </div>

      {next && (
        <div>
          <div className="flex justify-between mb-1.5">
            <span className="telemetry !text-[9px]">Next · {next.name}</span>
            <span className="readout text-[11px] text-cyan">{toNext} to go</span>
          </div>
          <div className="h-1 rounded-full bg-carbon-3 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan/70 to-emerald"
              style={{ width: `${Math.round(progress * 100)}%` }}
            />
          </div>
        </div>
      )}

      {points.reports === 0 ? (
        <p className="text-[12px] text-ink-faint font-light leading-relaxed border-t border-line pt-3.5">
          You have not filed a report from this device yet, so this is zero. It is
          not a score anyone assigned you — Eco-Points are counted in this browser
          from your own reports, and clearing site data clears them. They are a
          progress display: they cannot be spent, transferred or exchanged for
          anything, and nothing on the platform is gated behind them.
        </p>
      ) : (
        <div className="border-t border-line pt-3.5 flex flex-col gap-1.5">
          <Row label={`Reports filed · ${POINTS.submission} each`} value={points.submission} />
          {points.corroboration > 0 && (
            <Row label={`Corroborated · ${POINTS.corroboration} each`} value={points.corroboration} />
          )}
          {points.photoQuality > 0 && (
            <Row label={`Photo quality · ${POINTS.photoQuality} each`} value={points.photoQuality} />
          )}
          {points.followUp > 0 && (
            <Row label={`Follow-up updates · ${POINTS.followUp} each`} value={points.followUp} />
          )}
          <p className="telemetry !text-[8.5px] mt-1.5 leading-relaxed">
            Counted in this browser from your own reports. Not transferable, not
            redeemable, no monetary value.
          </p>
        </div>
      )}

      {/* ── Geographic badges ── */}
      <div className="border-t border-line pt-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="telemetry">Geographic badges</span>
          <span className="readout text-[11px] text-ink-faint">{earned}/{badges.length}</span>
        </div>
        <div className="flex flex-col gap-2.5">
          {badges.map(({ badge, count, earned: got, progress: p }) => (
            <div
              key={badge.id}
              className={`rounded-xl border p-3 transition-colors ${
                got ? "border-emerald/30 bg-emerald/[0.05]" : "border-line"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span
                  className={`text-lg leading-none shrink-0 ${got ? "text-emerald" : "text-ink-faint opacity-50"}`}
                  aria-hidden
                >
                  {badge.glyph}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-[12.5px] font-medium leading-snug flex items-center gap-1.5">
                    {badge.name}
                    {!badge.thresholdFromDoc && (
                      <SourceNote
                        source={`The Community 2.0 concept names this badge and its region but no report count. The threshold of ${badge.threshold} is Aetheris's, matching the Aral badge, and can be retuned — it is not from the document.`}
                      />
                    )}
                  </div>
                  <div className="telemetry !text-[8.5px] mt-0.5">
                    {badge.gloss} · {badge.where}
                  </div>
                </div>
                <span className="readout text-[11px] text-ink-faint shrink-0">
                  {count}/{badge.threshold}
                </span>
              </div>
              {!got && (
                <div className="h-0.5 rounded-full bg-carbon-3 overflow-hidden mt-2.5">
                  <div
                    className="h-full rounded-full bg-cyan/60"
                    style={{ width: `${Math.round(p * 100)}%` }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── The ladder ── */}
      <details className="border-t border-line pt-3.5">
        <summary className="telemetry cursor-pointer hover:text-ink transition-colors list-none">
          The full rank ladder ▾
        </summary>
        <ol className="flex flex-col gap-1 mt-3">
          {RANKS.map((r) => (
            <li
              key={r.name}
              className={`flex items-center justify-between text-[12px] ${
                r.name === rank.name ? "text-emerald" : "text-ink-faint"
              }`}
            >
              <span
                title={r.docName ? `Written «${r.docName}» in the Community 2.0 concept.` : undefined}
                className={r.docName ? "cursor-help" : ""}
              >
                {r.name}
              </span>
              <span className="readout text-[10.5px]">{r.at}</span>
            </li>
          ))}
        </ol>
        <p className="telemetry !text-[8.5px] mt-3 leading-relaxed">
          Observer, Sentinel and Constellation are the names already used on the
          platform; Field Researcher and Eco-Inspector are the two ranks the
          Community 2.0 concept inserts between them. The point thresholds are
          Aetheris&apos;s own — the concept sets the order, not the numbers.
        </p>
      </details>
    </GlassCard>
  );
}

function Row({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between text-[12px]">
      <span className="text-ink-faint font-light">{label}</span>
      <span className="readout text-emerald">+{value}</span>
    </div>
  );
}
