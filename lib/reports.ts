/* ─────────────────────────────────────────────────────────────
   AETHERIS · Community field reports
   Domain model + a client-side persistence layer. Aetheris ships as
   a static site with no backend, so user reports persist to
   localStorage — real persistence that survives reloads. The API
   (createReport / getUserReports) is intentionally async and
   storage-agnostic, so swapping in a real endpoint later is a
   drop-in change with no UI rewrite.
   ───────────────────────────────────────────────────────────── */

import {
  existingReportIds,
  insertRemoteReport,
  listRemoteReports,
  type RemoteReport,
} from "./supabase";

export type ReportCategory =
  | "air"
  | "water"
  | "waste"
  | "biodiversity"
  | "industrial";

export type Severity = "low" | "moderate" | "high" | "critical";

/**
 * The five statuses of Community 2.0, in the order a report travels
 * through them. See supabase/community-2.sql for the database side.
 *
 * There is no "verified" and no "resolved" here, and their absence is the
 * design rather than a gap. Aetheris has no moderators, no instrument
 * check standing behind a field report, and no legal responsibility for
 * verification — so it must not print a word that claims any of the
 * three. "corroborated" says independent devices described the same
 * thing. "forwarded" says data moved. Neither says the report is true.
 */
export type ReportStatus =
  | "submitted"
  | "ai-context"
  | "corroborated"
  | "forwarded"
  | "org-response";

export type Tone = "emerald" | "cyan" | "amber" | "coral" | "atmos";

export interface Report {
  id: string;
  author: string;
  initials: string;
  city: string;
  /** Coordinates from the submission flow's draggable pin, when given. */
  lat?: number | null;
  lon?: number | null;
  /** Static label for seed reports (e.g. "3 h ago"). User reports use createdAt instead. */
  time?: string;
  /** Epoch ms — present on user-created reports; drives relative time. */
  createdAt?: number;
  category: ReportCategory;
  severity: Severity;
  title: string;
  body: string;
  /** Optional downscaled data-URL thumbnail. */
  photo?: string;
  /**
   * Stored status. Never "ai-context": that one is derived at render time
   * from whether the live context resolved — see resolveStatus().
   */
  status: ReportStatus;
  upvotes: number;
  comments: number;
  userCreated?: boolean;
  /** True when this row came back from Postgres, not seed or localStorage. */
  remote?: boolean;

  /* ── ④ / ⑤. Operator-written; absent on everything else. ── */
  forwardedAt?: number | null;
  forwardedTo?: string | null;
  orgResponse?: string | null;
  orgResponseOrg?: string | null;
  orgResponseAt?: number | null;

  /* ── Eco-Points inputs ── */
  /** Set when this report is a follow-up on one of your earlier ones. */
  parentId?: string | null;
  /** Photo cleared the sharpness/size check in the submission flow. */
  photoQuality?: boolean;
}

export const CATEGORIES: Record<
  ReportCategory,
  { label: string; glyph: string; tone: Tone; example: string }
> = {
  air: {
    label: "Air",
    glyph: "◬",
    tone: "cyan",
    example: "e.g. Heavy smog over Almaty after a morning inversion",
  },
  water: {
    label: "Water",
    glyph: "◈",
    tone: "atmos",
    example: "e.g. Oil sheen along the Ural delta near Atyrau",
  },
  waste: {
    label: "Waste",
    glyph: "⬡",
    tone: "amber",
    example: "e.g. Illegal dumping site expanding by the canal",
  },
  biodiversity: {
    label: "Biodiversity",
    glyph: "❋",
    tone: "emerald",
    example: "e.g. Early flamingo return at Lake Burabay",
  },
  industrial: {
    label: "Industrial pollution",
    glyph: "⬢",
    tone: "coral",
    example: "e.g. Smelter dust settling on the Balkhash lakefront",
  },
};

export const SEVERITIES: Record<Severity, { label: string; tone: Tone }> = {
  low: { label: "Low", tone: "emerald" },
  moderate: { label: "Moderate", tone: "cyan" },
  high: { label: "High", tone: "amber" },
  critical: { label: "Critical", tone: "coral" },
};

/* ── Status vocabulary ────────────────────────────────────────
   `label` is the status name exactly as the Community 2.0 concept writes
   it, in the concept's own words; `gloss` is the English reading of that
   name, shown beside or beneath it so the page stays legible to an
   English reader without any name being paraphrased away.

   `note` is surfaced as a tooltip on the chip so the meaning travels with
   the label. The old "cross-checking" chip read "Cross-checking vs
   sensors", which promised an instrument check that does not exist; what
   actually happens is corroboration between independent reporters. See
   supabase/corroboration.sql. */
export const STATUS_META: Record<
  ReportStatus,
  { step: number; label: string; gloss: string; tone: Tone; note: string }
> = {
  submitted: {
    step: 1,
    label: "Отправлен",
    gloss: "Submitted",
    tone: "atmos",
    note: "Filed and stored, with nothing else claimed about it. No moderator has read it, no instrument has checked it, and no other report has corroborated it yet.",
  },
  "ai-context": {
    step: 2,
    label: "AI-контекст добавлен",
    gloss: "AI context attached",
    tone: "cyan",
    note: "Aetheris Analyst attached comparable data from a live feed — the nearest air-quality station, or the species-occurrence record for this area. It is context placed beside the report, not a judgement about whether the report is right.",
  },
  corroborated: {
    step: 3,
    label: "Corroborated сообществом",
    gloss: "Corroborated by the community",
    tone: "emerald",
    note: "At least two different devices reported this category in this city within 72 hours. That is corroboration, not verification: independent people described the same kind of problem in the same place. It does not mean the reports are accurate, and no instrument has checked them.",
  },
  forwarded: {
    step: 4,
    label: "Передано в акимат/эко-инспекцию",
    gloss: "Forwarded to the akimat / environmental inspectorate",
    tone: "amber",
    note: "A record that this report was handed on to a public body, with who sent it, when and where kept in an open log. It is an event in the report's history, not an assessment of whether it is true, and it implies nothing about how — or whether — the recipient responded.",
  },
  "org-response": {
    step: 5,
    label: "Ответ организации",
    gloss: "Organisation response",
    tone: "coral",
    note: "An organisation left an official comment on this report, quoted as sent and attributed to it by name. Only organisations that have agreed to appear on the platform are ever named here.",
  },
};

/** The five statuses in order — for the legend and the status filter. */
export const STATUS_ORDER: ReportStatus[] = [
  "submitted",
  "ai-context",
  "corroborated",
  "forwarded",
  "org-response",
];

/**
 * Map whatever the database holds onto the display vocabulary.
 *
 * Handles the pre-2.0 values too, so the site behaves identically against
 * a database that has not had supabase/community-2.sql applied. Legacy
 * "verified" becomes "submitted" rather than "corroborated": nothing in
 * the old system ever set it — inserts were forced to 'pending' and the
 * trigger only ever wrote 'cross-checking' — so a row holding it carries
 * no corroboration evidence and must not be promoted into a claim.
 */
export function statusFromRemote(s: string | null | undefined): ReportStatus {
  switch (s) {
    case "corroborated":
    case "cross-checking":
      return "corroborated";
    case "forwarded":
      return "forwarded";
    case "org-response":
      return "org-response";
    default:
      return "submitted";
  }
}

/**
 * The status a card should actually show.
 *
 * ② is derived rather than stored, on purpose. The AI context is computed
 * live in the browser from the same Open-Meteo / GBIF feeds the city pages
 * use, so there is no column a client could POST the platform's own
 * framing into. The later states win: a corroborated or forwarded report
 * does not walk back to ② just because its context bubble has loaded.
 */
export function resolveStatus(r: Report, aiContextReady: boolean): ReportStatus {
  if (r.status !== "submitted") return r.status;
  return aiContextReady ? "ai-context" : "submitted";
}

/* ── Named-organisation safety pass ───────────────────────────
   A field report is one person's account. When it names an outside body
   — a state agency, a monitoring service, an operator — the page starts
   to read as though that body were involved in, or endorsing, the claim.
   Neither is true: nothing here is verified, and Aetheris has no
   relationship with any of them.

   So any report whose text names an organisation gets an independence
   disclaimer rendered beside it. This is a general rule, not a patch for
   one report: reports are public and anonymous, so this will recur, and
   it must also cover names nobody has thought of yet.

   The watchlist is explicit rather than clever on purpose. Guessing at
   organisations from capitalisation would tag "Ural Delta" and miss
   "kazhydromet" in lower case; a readable table can be argued with and
   extended. Matching is case-insensitive and covers Latin and Cyrillic
   spellings, since reports arrive in three languages. */

const ORGANISATION_PATTERNS: RegExp[] = [
  // National agencies and services
  /kazhydromet|казгидромет|қазгидромет/i,
  /airkaz/i,
  /\bakimat\b|акимат|әкімдік/i,
  /ministry of\s+\w+|министерств\w*|министрлі\w*/i,
  /\bkazselezashita\b|казселезащита/i,
  // Major operators most likely to appear in pollution reports
  /kazmunaygas|казмунайгаз|tengizchevroil|тенгизшевройл/i,
  /arcelormittal|арселормиттал|qarmet|qarmet/i,
  /kazakhmys|казахмыс|kazzinc|казцинк|kazatomprom|казатомпром/i,
  /eurasian resources|erg\b|kegoc|кегок|samruk|самрук/i,
  // Generic corporate forms — catches operators not on the list above
  /\b(jsc|llp|ltd|inc)\b|\bао\s|\bтоо\s|\bжшс\s/i,
];

/**
 * Returns true when a report names an outside organisation and therefore
 * needs the independence disclaimer. Checks title and body together —
 * a name in either is equally public.
 */
export function namesOrganisation(r: Pick<Report, "title" | "body">): boolean {
  const text = `${r.title} ${r.body}`;
  return ORGANISATION_PATTERNS.some((re) => re.test(text));
}

/* ── Seed feed — Kazakhstan field reports across every category ──
   Illustrative rows, marked "Sample" everywhere they render.

   Two constraints on what statuses they may carry. They only ever use ①
   and ③, and the two ③ rows are a coherent pair — two different authors,
   same category, same city — so the sample feed obeys the same
   corroboration rule the real one does instead of asserting a status the
   rule could not have produced.

   None of them is ever ④ or ⑤. Marking a sample report as forwarded to a
   public body, or as having drawn a reply from one, would be inventing
   traction this project does not have. */

export const SEED_REPORTS: Report[] = [
  {
    id: "seed-almaty-smog",
    author: "Aigerim K.",
    initials: "AK",
    city: "Almaty · Bostandyk",
    lat: 43.234,
    lon: 76.905,
    time: "22 min ago",
    category: "air",
    severity: "high",
    title: "Heavy smog layer after morning inversion",
    body: "Grey band sitting over the southern districts toward the foothills. Visibility down sharply; my own handheld read PM2.5 around 140 µg/m³ at 08:10 local.",
    status: "submitted",
    upvotes: 164,
    comments: 31,
  },
  {
    id: "seed-karaganda-haze",
    author: "Nurlan T.",
    initials: "NT",
    city: "Karaganda · Steel district",
    lat: 49.806,
    lon: 73.086,
    time: "48 min ago",
    category: "industrial",
    severity: "high",
    title: "Persistent haze over the Temirtau–Karaganda belt",
    body: "Brown plume hanging low all morning, strong sulphur smell near the ring road. Visibility down noticeably versus yesterday.",
    status: "corroborated",
    upvotes: 119,
    comments: 26,
  },
  {
    /* The second half of the corroborated pair: a different reporter,
       same category, same city, inside the 72-hour window. Without it the
       chip above would be claiming a status the rule cannot produce from
       one device. */
    id: "seed-karaganda-dust",
    author: "Saltanat B.",
    initials: "SB",
    city: "Karaganda · Steel district",
    lat: 49.795,
    lon: 73.121,
    time: "3 h ago",
    category: "industrial",
    severity: "moderate",
    title: "Grey dust settling on cars near the ring road",
    body: "Fine grey film over every parked car on our street by mid-morning, second day running. Same brown layer visible toward the plant.",
    status: "corroborated",
    upvotes: 47,
    comments: 9,
  },
  {
    id: "seed-atyrau-sheen",
    author: "Daniyar S.",
    initials: "DS",
    city: "Atyrau · Ural delta",
    lat: 47.094,
    lon: 51.923,
    time: "1 h ago",
    category: "water",
    severity: "moderate",
    title: "Oil sheen spreading along the riverbank",
    body: "Rainbow film stretching ~200m downstream of the industrial outfall. Sample logged with kit #ATY-07; requesting an independent laboratory cross-check.",
    status: "submitted",
    upvotes: 58,
    comments: 14,
  },
  {
    id: "seed-aktau-caspian",
    author: "Zarina M.",
    initials: "ZM",
    city: "Aktau · Caspian shore",
    lat: 43.641,
    lon: 51.198,
    time: "2 h ago",
    category: "water",
    severity: "moderate",
    title: "Discoloured foam along the Caspian shoreline",
    body: "Yellowish foam and a chemical odour over roughly 150m of beach near the seawater intake. Seal-monitoring volunteers notified.",
    status: "submitted",
    upvotes: 84,
    comments: 17,
  },
  {
    id: "seed-shymkent-dumping",
    author: "Bekzat A.",
    initials: "BA",
    city: "Shymkent · Badam canal",
    lat: 42.317,
    lon: 69.596,
    time: "4 h ago",
    category: "waste",
    severity: "moderate",
    title: "Illegal dumping expanding along the canal",
    body: "Construction debris and household waste tipped over the bank, partly in the water. Third sighting this month — requesting municipal escalation.",
    status: "submitted",
    upvotes: 61,
    comments: 12,
  },
  {
    id: "seed-burabay-flamingo",
    author: "Madina T.",
    initials: "MT",
    city: "Kokshetau · Burabay",
    lat: 53.083,
    lon: 70.303,
    time: "5 h ago",
    category: "biodiversity",
    severity: "low",
    title: "Flamingo flock returned to the lake early",
    body: "Around forty birds on the northern shallows — eight days earlier than the 10-year median. Logged to the migration tracker.",
    status: "submitted",
    upvotes: 97,
    comments: 21,
  },
];

/* ── Persistence ─────────────────────────────────────────────
   Two tiers. Supabase is the real store: a report written there is
   visible to every visitor, in any browser. localStorage remains as the
   fallback for when the backend is unreachable or the table is missing,
   so submission never simply fails.

   `remote: true` on a Report means it came back from Postgres — the feed
   uses that to separate real submissions from the six seeded examples,
   and nothing marked remote is ever labelled sample data. */

const STORAGE_KEY = "aetheris.community.reports.v1";
const ANON_KEY = "aetheris.community.anon.v1";
const MAX_STORED = 40;

/**
 * Stable anonymous device identifier. Not an account and not identity:
 * it only lets a device recognise rows it wrote. Cleared with site data.
 */
export function anonId(): string {
  if (typeof window === "undefined") return "server";
  try {
    const existing = window.localStorage.getItem(ANON_KEY);
    if (existing) return existing;
    const id =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `a-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
    window.localStorage.setItem(ANON_KEY, id);
    return id;
  } catch {
    return `a-${Math.random().toString(36).slice(2, 10)}`;
  }
}

const initials = (name: string) =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("") || "AN";

/**
 * Thrown when the datastore refuses a submission because the device has
 * filed too many recently. Its own type so the UI can say "come back
 * later" rather than showing a generic failure — the report was not
 * saved anywhere, and the user needs to know that.
 */
export class RateLimitError extends Error {
  readonly scope: "hourly" | "daily";
  constructor(scope: "hourly" | "daily") {
    super(`rate limit reached (${scope})`);
    this.name = "RateLimitError";
    this.scope = scope;
  }
}

const ms = (s: string | null | undefined): number | null =>
  s ? new Date(s).getTime() : null;

/** Map a Postgres row onto the Report shape the feed already renders. */
function fromRemote(r: RemoteReport): Report {
  return {
    id: r.id,
    author: r.author,
    initials: initials(r.author),
    city: r.city,
    lat: r.lat,
    lon: r.lon,
    createdAt: new Date(r.created_at).getTime(),
    category: r.category,
    severity: r.severity,
    title: r.title,
    body: r.body,
    status: statusFromRemote(r.status),
    upvotes: r.upvotes,
    comments: 0,
    userCreated: r.anon_id === anonId(),
    remote: true,
    forwardedAt: ms(r.forwarded_at),
    forwardedTo: r.forwarded_to ?? null,
    orgResponse: r.org_response ?? null,
    orgResponseOrg: r.org_response_org ?? null,
    orgResponseAt: ms(r.org_response_at),
    parentId: r.parent_id ?? null,
    photoQuality: r.photo_quality ?? false,
  };
}

/** Every real submission, newest first. Null when the backend is down. */
export async function getRemoteReports(signal?: AbortSignal): Promise<Report[] | null> {
  const rows = await listRemoteReports(50, signal);
  return rows ? rows.map(fromRemote) : null;
}

/** Whether the datastore is actually reachable right now. */
export { backendReachable } from "./supabase";

function newId(): string {
  try {
    if (typeof crypto !== "undefined" && crypto.randomUUID) return `r-${crypto.randomUUID()}`;
  } catch {
    /* fall through */
  }
  return `r-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Load previously-submitted reports for this device (newest first). */
export function getUserReports(): Report[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((r): r is Report => !!r && typeof r.id === "string" && typeof r.title === "string")
      .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
  } catch {
    return [];
  }
}

/**
 * Drop local mirrors of reports that no longer exist in Postgres.
 *
 * createReport keeps a copy of every submission in localStorage beside the
 * database row — the table stores no image, so the photo lives only here,
 * and the copy keeps the feed populated when the backend is unreachable.
 * That mirror carries `remote: true`, which is what puts the "Filed" mark
 * on the card and tells the reader the report is in the shared database
 * and visible to everyone.
 *
 * Nothing used to take that mark back. When a row was deleted from
 * Postgres its mirror stayed in the feed on the author's own device,
 * indefinitely, still claiming to be filed. Only the author saw it and
 * only after an operator deletion — but it is the same failure as a
 * confirmation screen promising a report was filed when it was not: the
 * UI asserting something about storage that has stopped being true.
 *
 * Returns the reports this device should still show, plus the ids that
 * were dropped. The caller needs that second list: rewriting storage is
 * not enough on its own, because whatever the feed already rendered from
 * the pre-pruning read is still on screen, and only an explicit set of
 * dead ids can be filtered out of it no matter which pass wrote it.
 *
 * On any uncertainty — datastore unreachable, request failed — nothing is
 * removed: losing someone's only copy of a photo to a transient network
 * error would be a far worse bug than the one being fixed.
 */
export async function reconcileLocalMirrors(
  signal?: AbortSignal,
): Promise<{ kept: Report[]; removed: string[] }> {
  const stored = getUserReports();
  const mirrored = stored.filter((r) => r.remote).map((r) => r.id);
  if (mirrored.length === 0) return { kept: stored, removed: [] };

  const alive = await existingReportIds(mirrored, signal);
  if (!alive) return { kept: stored, removed: [] }; // could not check

  const kept = stored.filter((r) => !r.remote || alive.has(r.id));
  const removed = stored.filter((r) => r.remote && !alive.has(r.id)).map((r) => r.id);
  if (removed.length === 0) return { kept: stored, removed: [] };

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(kept));
  } catch {
    /* pruning is best-effort; the filtered list is still what we return */
  }
  return { kept, removed };
}

export interface NewReportInput {
  category: ReportCategory;
  severity: Severity;
  title: string;
  body: string;
  city: string;
  photo?: string;
  /** Pin position from step 2 of the submission flow. */
  lat?: number | null;
  lon?: number | null;
  /** Photo cleared the sharpness/size check — worth the +5 Eco-Points bonus. */
  photoQuality?: boolean;
  /** Set when filing an update on one of your own earlier reports (+15). */
  parentId?: string | null;
}

/**
 * Persist a new report. Returns the stored record. Throws on a genuine
 * storage failure (quota / disabled storage) so the UI can surface it —
 * we never silently pretend a write succeeded.
 */
export async function createReport(input: NewReportInput): Promise<Report> {
  const report: Report = {
    id: newId(),
    author: "You",
    initials: "YOU",
    city: input.city,
    lat: input.lat ?? null,
    lon: input.lon ?? null,
    createdAt: Date.now(),
    category: input.category,
    severity: input.severity,
    title: input.title.trim(),
    body: input.body.trim(),
    photo: input.photo,
    status: "submitted",
    upvotes: 0,
    comments: 0,
    userCreated: true,
    photoQuality: input.photoQuality ?? false,
    parentId: input.parentId ?? null,
  };

  if (typeof window === "undefined") {
    throw new Error("Reports can only be submitted in the browser.");
  }

  // Try the real datastore first. On success the report is public and
  // survives this browser; the row's own id and timestamp win.
  const result = await insertRemoteReport({
    anon_id: anonId(),
    author: "Anonymous",
    city: input.city,
    lat: input.lat ?? null,
    lon: input.lon ?? null,
    category: input.category,
    severity: input.severity,
    title: report.title,
    body: report.body,
    photo_quality: input.photoQuality ?? false,
    parent_id: input.parentId ?? null,
  });

  // A refusal is an answer, not an outage: falling back to localStorage here
  // would show the user a success toast for a report the database declined.
  if (!result.ok && result.reason === "rate-limited") {
    throw new RateLimitError(result.scope);
  }

  if (result.ok) {
    // Keep a local copy too: the photo lives only on this device (the
    // table stores no image), and it keeps the feed populated offline.
    // photoQuality / parentId come back from the row when community-2.sql
    // has been applied and are absent when it has not — keep the values the
    // flow actually computed, so this device's Eco-Points stay right either
    // way. The photo itself lives only here; the table stores no image.
    const merged: Report = {
      ...fromRemote(result.row),
      photo: input.photo,
      userCreated: true,
      photoQuality: input.photoQuality ?? result.row.photo_quality ?? false,
      parentId: input.parentId ?? result.row.parent_id ?? null,
    };
    try {
      const existing = getUserReports();
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify([merged, ...existing].slice(0, MAX_STORED)),
      );
    } catch {
      /* local mirror is best-effort — the durable copy is already in Postgres */
    }
    return merged;
  }

  // Backend unreachable or table missing — fall back to device-only storage.

  const existing = getUserReports();
  const next = [report, ...existing].slice(0, MAX_STORED);
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Most commonly a quota error from an attached photo. Retry without it
    // rather than losing the whole report.
    if (report.photo) {
      const lean = { ...report, photo: undefined };
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify([lean, ...existing].slice(0, MAX_STORED)),
      );
      return lean;
    }
    throw new Error("Couldn't save the report — device storage is full.");
  }
  return report;
}

/* ── Helpers ─────────────────────────────────────────────────── */

export function relativeTime(ts: number): string {
  const s = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  if (s < 45) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  return `${Math.floor(s / 86400)} d ago`;
}

export function displayTime(r: Report): string {
  return r.createdAt ? relativeTime(r.createdAt) : (r.time ?? "");
}

/* ── Photo handling + the quality check behind the +5 bonus ───
   Two jobs in one pass over the image, because both need it decoded:

   1. Downscale to a JPEG data URL so a photo can persist in localStorage
      without blowing the quota.
   2. Score it, for the +5 Eco-Points "good photo" bonus.

   The score is deliberately crude and mechanical: source resolution above
   a floor, plus a variance-of-Laplacian sharpness estimate. It measures
   whether an image is big enough and in focus enough to be worth looking
   at — nothing about whether it shows what the report says it shows, and
   nothing that could be read as the platform assessing the report. A
   blurry photo of a real spill still files a real report; it just does
   not earn the bonus. */

/** Long edge, in source pixels, below which a photo is too small to score. */
export const PHOTO_MIN_EDGE = 640;
/** Variance-of-Laplacian floor. Below this an image reads as out of focus. */
export const PHOTO_MIN_SHARPNESS = 55;

export interface ProcessedPhoto {
  /** Downscaled JPEG data URL, safe for localStorage. */
  dataUrl: string;
  /** Passed both the resolution floor and the sharpness floor. */
  quality: boolean;
  width: number;
  height: number;
  sharpness: number;
}

/** Variance of the Laplacian over a grayscale copy — a standard focus proxy. */
function sharpnessOf(ctx: CanvasRenderingContext2D, w: number, h: number): number {
  if (w < 3 || h < 3) return 0;
  const { data } = ctx.getImageData(0, 0, w, h);
  const gray = new Float32Array(w * h);
  for (let i = 0; i < w * h; i += 1) {
    // Rec. 601 luma — the usual weighting for perceived brightness.
    gray[i] = 0.299 * data[i * 4] + 0.587 * data[i * 4 + 1] + 0.114 * data[i * 4 + 2];
  }
  let sum = 0;
  let sumSq = 0;
  let n = 0;
  for (let y = 1; y < h - 1; y += 1) {
    for (let x = 1; x < w - 1; x += 1) {
      const i = y * w + x;
      const lap =
        4 * gray[i] - gray[i - 1] - gray[i + 1] - gray[i - w] - gray[i + w];
      sum += lap;
      sumSq += lap * lap;
      n += 1;
    }
  }
  if (!n) return 0;
  const mean = sum / n;
  return sumSq / n - mean * mean;
}

/**
 * Read an image File, downscale it, and score it. Rejects on non-images or
 * read failures.
 */
export function processPhoto(file: File, max = 520, jpegQuality = 0.72): Promise<ProcessedPhoto> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("Please choose an image file."));
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Couldn't read that file."));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Couldn't load that image."));
      img.onload = () => {
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        // willReadFrequently: the sharpness pass calls getImageData once, and
        // without the hint some browsers keep the canvas GPU-side and stall.
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) {
          reject(new Error("Image processing isn't supported here."));
          return;
        }
        ctx.drawImage(img, 0, 0, w, h);

        let sharpness = 0;
        try {
          sharpness = sharpnessOf(ctx, w, h);
        } catch {
          // A tainted or oversized canvas can refuse getImageData. Losing the
          // score must never cost the user the photo, so fall through with 0.
          sharpness = 0;
        }

        resolve({
          dataUrl: canvas.toDataURL("image/jpeg", jpegQuality),
          quality:
            Math.max(img.width, img.height) >= PHOTO_MIN_EDGE &&
            sharpness >= PHOTO_MIN_SHARPNESS,
          width: img.width,
          height: img.height,
          sharpness: Math.round(sharpness),
        });
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}
