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
import { useCommunityText } from "@/lib/useLocale";

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
  const t = useCommunityText().badges;
  const rankName = (n: string) => t.ranks[n] ?? n;

  return (
    <GlassCard bright className="p-5 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="telemetry mb-1">{t.ecoPoints}</div>
          <div className="readout text-3xl text-emerald leading-none">{points.total}</div>
        </div>
        <div className="text-right">
          <div className="telemetry mb-1">{t.rank}</div>
          <div
            title={rank.docName ? t.writtenInConcept(rank.docName) : undefined}
            className={`font-[family-name:var(--font-syne)] font-bold text-lg leading-none ${
              rank.docName ? "cursor-help" : ""
            }`}
          >
            {rankName(rank.name)}
          </div>
        </div>
      </div>

      {next && (
        <div>
          <div className="flex justify-between mb-1.5">
            <span className="telemetry !text-[0.9375rem]">{t.next(rankName(next.name))}</span>
            <span className="readout text-[0.9375rem] text-cyan">{t.toGo(toNext)}</span>
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
        <p className="text-[0.9375rem] text-ink-faint font-light leading-relaxed border-t border-line pt-3.5">
          {t.zero}
        </p>
      ) : (
        <div className="border-t border-line pt-3.5 flex flex-col gap-1.5">
          <Row label={t.rowFiled(POINTS.submission)} value={points.submission} />
          {points.corroboration > 0 && (
            <Row label={t.rowCorroborated(POINTS.corroboration)} value={points.corroboration} />
          )}
          {points.photoQuality > 0 && (
            <Row label={t.rowPhoto(POINTS.photoQuality)} value={points.photoQuality} />
          )}
          {points.followUp > 0 && (
            <Row label={t.rowFollow(POINTS.followUp)} value={points.followUp} />
          )}
          <p className="telemetry !text-[0.9375rem] mt-1.5 leading-relaxed">
            {t.countedHere}
          </p>
        </div>
      )}

      {/* ── Geographic badges ── */}
      <div className="border-t border-line pt-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="telemetry">{t.geoTitle}</span>
          <span className="readout text-[0.9375rem] text-ink-faint">{earned}/{badges.length}</span>
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
                  <div className="text-[0.9375rem] font-medium leading-snug flex items-center gap-1.5">
                    {t.geo[badge.id]?.name ?? badge.name}
                    {!badge.thresholdFromDoc && (
                      <SourceNote source={t.thresholdNote(badge.threshold)} />
                    )}
                  </div>
                  <div className="telemetry !text-[0.9375rem] mt-0.5">
                    {t.geo[badge.id]?.gloss ?? badge.gloss} · {t.geo[badge.id]?.where ?? badge.where}
                  </div>
                </div>
                <span className="readout text-[0.9375rem] text-ink-faint shrink-0">
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
          {t.ladder}
        </summary>
        <ol className="flex flex-col gap-1 mt-3">
          {RANKS.map((r) => (
            <li
              key={r.name}
              className={`flex items-center justify-between text-[0.9375rem] ${
                r.name === rank.name ? "text-emerald" : "text-ink-faint"
              }`}
            >
              <span
                title={r.docName ? t.writtenInConcept(r.docName) : undefined}
                className={r.docName ? "cursor-help" : ""}
              >
                {rankName(r.name)}
              </span>
              <span className="readout text-[0.9375rem]">{r.at}</span>
            </li>
          ))}
        </ol>
        <p className="telemetry !text-[0.9375rem] mt-3 leading-relaxed">
          {t.ladderNote}
        </p>
      </details>
    </GlassCard>
  );
}

function Row({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between text-[0.9375rem]">
      <span className="text-ink-faint font-light">{label}</span>
      <span className="readout text-emerald">+{value}</span>
    </div>
  );
}
