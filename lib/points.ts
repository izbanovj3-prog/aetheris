/* ─────────────────────────────────────────────────────────────
   AETHERIS · Eco-Points, ranks and geographic badges
   ─────────────────────────────────────────────────────────────
   Block 2 of the Community 2.0 concept.

   The name is load-bearing and is not a style preference. This mechanic is
   called "Eco-Points" everywhere it appears, and never "tokens", never
   "coins", never "баллы, конвертируемые в деньги". Points are not
   transferable, not redeemable, and carry no monetary value of any kind.
   A project run by minors that is asking government bodies for
   partnerships does not need a mechanic that can be mistaken for a
   financial instrument.

   Points are computed on the device, from that device's own reports. They
   are a progress display, not a ledger: there is no account to attach them
   to, nothing is spent, and clearing site data clears them. Because the
   inputs (photo_quality, parent_id) are client-written, a determined
   person can inflate their own total — which changes a number only they
   can see, and is why nothing on the platform is gated behind it.
   ───────────────────────────────────────────────────────────── */

import type { Report, ReportStatus } from "./reports";

/* ── Point values ─────────────────────────────────────────────
   Fixed by the concept. The +25 in particular is the number already
   printed on the report card in the current UI, kept rather than
   re-derived so the two cannot drift apart. */

export const POINTS = {
  /** Filing a report. */
  submission: 10,
  /** The report reached ③ Corroborated сообществом. */
  corroboration: 25,
  /** The attached photo passed the sharpness/resolution check. */
  photoQuality: 5,
  /** A follow-up update on one of your own earlier reports. */
  followUp: 15,
} as const;

/** Statuses at or past ③ — all of them earn the corroboration bonus.
 *  ④ and ⑤ overwrite ③ in the database, so checking only for
 *  "corroborated" would silently take 25 points back off someone the
 *  moment their report was forwarded. */
const CORROBORATED_OR_BEYOND: ReportStatus[] = [
  "corroborated",
  "forwarded",
  "org-response",
];

export interface PointsBreakdown {
  total: number;
  reports: number;
  submission: number;
  corroboration: number;
  photoQuality: number;
  followUp: number;
}

/** Eco-Points earned by a set of reports — normally one device's own. */
export function computePoints(reports: Report[]): PointsBreakdown {
  let submission = 0;
  let corroboration = 0;
  let photoQuality = 0;
  let followUp = 0;

  for (const r of reports) {
    submission += POINTS.submission;
    if (CORROBORATED_OR_BEYOND.includes(r.status)) corroboration += POINTS.corroboration;
    if (r.photoQuality) photoQuality += POINTS.photoQuality;
    if (r.parentId) followUp += POINTS.followUp;
  }

  return {
    total: submission + corroboration + photoQuality + followUp,
    reports: reports.length,
    submission,
    corroboration,
    photoQuality,
    followUp,
  };
}

/* ── Rank ladder ──────────────────────────────────────────────
   Extends the progression already live in the product rather than running
   a second one alongside it: Observer and Sentinel are the names the UI
   already used, and Constellation was already an achievement — the
   concept promotes it to the top rank, which is what it is here. Field
   Researcher and Eco-Inspector are the concept's two new intermediate
   ranks, inserted between them.

   Caveat worth stating: the concept names the ranks and their order but
   gives no point thresholds for them. The numbers below are therefore
   ours, not the document's, chosen so the first rank is reachable with a
   single report and the top one needs sustained contribution. They are
   the one part of this file that can be retuned freely. */

export interface Rank {
  name: string;
  at: number;
  /**
   * Set only where the concept writes the rank differently from how it is
   * shown. Applies to exactly one rung — see below.
   */
  docName?: string;
}

/*
 * On the entry rank: the concept writes it «Новичок» and every other rung
 * in Latin script. The status and badge names are kept verbatim because
 * they are coined names — «Стражи Арала» is what that badge is called. A
 * rank meaning "beginner" is not; rendering it in Russian inside an
 * otherwise English ladder read as a bug rather than as fidelity to the
 * document. So it shows as "Newcomer" and carries the concept's word in
 * its tooltip, which is the same both-things-present treatment the
 * statuses get, applied the other way round.
 */
export const RANKS: Rank[] = [
  { name: "Newcomer", at: 0, docName: "Новичок" },
  { name: "Observer I", at: 10 },
  { name: "Observer II", at: 50 },
  { name: "Observer III", at: 120 },
  { name: "Field Researcher", at: 250 },
  { name: "Eco-Inspector", at: 450 },
  { name: "Sentinel I", at: 700 },
  { name: "Sentinel II", at: 1000 },
  { name: "Sentinel III", at: 1400 },
  { name: "Constellation", at: 2000 },
];

export interface RankProgress {
  rank: Rank;
  next: Rank | null;
  /** 0–1 through the current band; 1 at the top rank. */
  progress: number;
  toNext: number;
}

export function rankFor(points: number): RankProgress {
  let i = 0;
  while (i + 1 < RANKS.length && points >= RANKS[i + 1].at) i += 1;
  const rank = RANKS[i];
  const next = RANKS[i + 1] ?? null;
  if (!next) return { rank, next: null, progress: 1, toNext: 0 };
  const span = next.at - rank.at;
  return {
    rank,
    next,
    progress: span > 0 ? Math.min(1, (points - rank.at) / span) : 1,
    toNext: Math.max(0, next.at - points),
  };
}

/* ── Geographic badges ────────────────────────────────────────
   Tied to regions that are actually in the dataset, matched against the
   station names the submission flow writes into a report's `city` field —
   so no fuzzy matching is needed and a badge cannot quietly stop firing
   because a label was reworded.

   On thresholds: the concept states a count for two of the five —
   «Исследователь Алматы» at 10 reports and «Стражи Арала» at 5. For the
   other three it names the region but no number. Those three are set to 5
   here, matching the Aral badge, and are marked `thresholdFromDoc: false`
   so it stays visible which numbers came from the document and which are
   ours to change. */

export interface GeoBadge {
  id: string;
  /** The badge name exactly as the concept writes it. */
  name: string;
  /** English reading of the name, for the page's own language. */
  gloss: string;
  glyph: string;
  /** Reports needed in the matching area. */
  threshold: number;
  /** False where the concept named the region but not a count. */
  thresholdFromDoc: boolean;
  /** Station names counted toward this badge. */
  cities: string[];
  /** Shown under the badge in the showcase. */
  where: string;
}

export const GEO_BADGES: GeoBadge[] = [
  {
    id: "almaty",
    name: "Исследователь Алматы",
    gloss: "Almaty Explorer",
    glyph: "◬",
    threshold: 10,
    thresholdFromDoc: true,
    cities: ["Almaty"],
    where: "Almaty and the Almaty region",
  },
  {
    id: "aral",
    name: "Стражи Арала",
    gloss: "Guardians of the Aral",
    glyph: "◈",
    threshold: 5,
    thresholdFromDoc: true,
    cities: ["Aralsk", "Kyzylorda"],
    where: "The Aral Sea basin — Aralsk, Kyzylorda",
  },
  {
    id: "industrial",
    name: "Индустриальный дозор",
    gloss: "Industrial Watch",
    glyph: "⬢",
    threshold: 5,
    thresholdFromDoc: false,
    cities: ["Temirtau", "Karaganda"],
    where: "The Temirtau–Karaganda industrial belt",
  },
  {
    id: "balkhash",
    name: "Хранитель Балхаша",
    gloss: "Keeper of Balkhash",
    glyph: "❋",
    threshold: 5,
    thresholdFromDoc: false,
    cities: ["Balkhash"],
    where: "The Lake Balkhash basin",
  },
  {
    id: "caspian",
    name: "Каспийский дозорный",
    gloss: "Caspian Sentinel",
    glyph: "⬡",
    threshold: 5,
    thresholdFromDoc: false,
    cities: ["Atyrau", "Aktau", "Zhanaozen"],
    where: "The Caspian shore — Atyrau, Aktau, Zhanaozen",
  },
];

export interface BadgeProgress {
  badge: GeoBadge;
  count: number;
  earned: boolean;
  progress: number;
}

/**
 * A report counts toward a badge when its city label starts with one of
 * the badge's station names. `startsWith` rather than equality because the
 * seeded feed writes district suffixes ("Almaty · Bostandyk") that the
 * live submission flow does not.
 */
function inArea(report: Report, badge: GeoBadge): boolean {
  return badge.cities.some(
    (c) => report.city === c || report.city.startsWith(`${c} ·`),
  );
}

export function badgeProgress(reports: Report[]): BadgeProgress[] {
  return GEO_BADGES.map((badge) => {
    const count = reports.filter((r) => inArea(r, badge)).length;
    return {
      badge,
      count,
      earned: count >= badge.threshold,
      progress: Math.min(1, count / badge.threshold),
    };
  });
}
