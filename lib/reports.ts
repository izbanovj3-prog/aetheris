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

export type ReportStatus = "verified" | "cross-checking" | "pending";

export type Tone = "emerald" | "cyan" | "amber" | "coral" | "atmos";

export interface Report {
  id: string;
  author: string;
  initials: string;
  city: string;
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
  status: ReportStatus;
  upvotes: number;
  comments: number;
  userCreated?: boolean;
  /** True when this row came back from Postgres, not seed or localStorage. */
  remote?: boolean;
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

/* Status vocabulary. `note` is surfaced as a tooltip on the chip so the
   meaning travels with the label — "cross-checking" in particular used to
   read "Cross-checking vs sensors", which promised an instrument check
   that does not exist. What actually happens is corroboration between
   independent reporters; see supabase/corroboration.sql. */
export const STATUS_META: Record<
  ReportStatus,
  { label: string; tone: Tone; note: string }
> = {
  verified: {
    label: "Verified",
    tone: "emerald",
    note: "Reserved for reports confirmed against an instrument or an official source. Nothing is promoted here automatically — no report on the platform currently holds this status.",
  },
  "cross-checking": {
    label: "Corroborated",
    tone: "cyan",
    note: "At least two different devices reported this category in this city within 72 hours. That is corroboration, not verification: independent people described the same kind of problem in the same place. It does not mean the reports are accurate, and no instrument has checked them.",
  },
  pending: {
    label: "Awaiting review",
    tone: "amber",
    note: "Filed and stored, with nothing else claimed about it. No moderator has read it and no other report has corroborated it yet.",
  },
};

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

/* ── Seed feed — Kazakhstan field reports across every category ── */

export const SEED_REPORTS: Report[] = [
  {
    id: "seed-almaty-smog",
    author: "Aigerim K.",
    initials: "AK",
    city: "Almaty · Bostandyk",
    time: "22 min ago",
    category: "air",
    severity: "high",
    title: "Heavy smog layer after morning inversion",
    body: "Grey band sitting over the southern districts toward the foothills. Visibility down sharply; my own handheld read PM2.5 around 140 µg/m³ at 08:10 local.",
    status: "verified",
    upvotes: 164,
    comments: 31,
  },
  {
    id: "seed-karaganda-haze",
    author: "Nurlan T.",
    initials: "NT",
    city: "Karaganda · Steel district",
    time: "48 min ago",
    category: "industrial",
    severity: "high",
    title: "Persistent haze over the Temirtau–Karaganda belt",
    body: "Brown plume hanging low all morning, strong sulphur smell near the ring road. Visibility down noticeably versus yesterday.",
    status: "cross-checking",
    upvotes: 119,
    comments: 26,
  },
  {
    id: "seed-atyrau-sheen",
    author: "Daniyar S.",
    initials: "DS",
    city: "Atyrau · Ural delta",
    time: "1 h ago",
    category: "water",
    severity: "moderate",
    title: "Oil sheen spreading along the riverbank",
    body: "Rainbow film stretching ~200m downstream of the industrial outfall. Sample logged with kit #ATY-07; requesting an independent laboratory cross-check.",
    status: "cross-checking",
    upvotes: 58,
    comments: 14,
  },
  {
    id: "seed-aktau-caspian",
    author: "Zarina M.",
    initials: "ZM",
    city: "Aktau · Caspian shore",
    time: "2 h ago",
    category: "water",
    severity: "moderate",
    title: "Discoloured foam along the Caspian shoreline",
    body: "Yellowish foam and a chemical odour over roughly 150m of beach near the seawater intake. Seal-monitoring volunteers notified.",
    status: "pending",
    upvotes: 84,
    comments: 17,
  },
  {
    id: "seed-shymkent-dumping",
    author: "Bekzat A.",
    initials: "BA",
    city: "Shymkent · Badam canal",
    time: "4 h ago",
    category: "waste",
    severity: "moderate",
    title: "Illegal dumping expanding along the canal",
    body: "Construction debris and household waste tipped over the bank, partly in the water. Third sighting this month — requesting municipal escalation.",
    status: "pending",
    upvotes: 61,
    comments: 12,
  },
  {
    id: "seed-burabay-flamingo",
    author: "Madina T.",
    initials: "MT",
    city: "Kokshetau · Burabay",
    time: "5 h ago",
    category: "biodiversity",
    severity: "low",
    title: "Flamingo flock returned to the lake early",
    body: "Around forty birds on the northern shallows — eight days earlier than the 10-year median. Logged to the migration tracker.",
    status: "verified",
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

/** Map a Postgres row onto the Report shape the feed already renders. */
function fromRemote(r: RemoteReport): Report {
  return {
    id: r.id,
    author: r.author,
    initials: initials(r.author),
    city: r.city,
    createdAt: new Date(r.created_at).getTime(),
    category: r.category,
    severity: r.severity,
    title: r.title,
    body: r.body,
    status: r.status,
    upvotes: r.upvotes,
    comments: 0,
    userCreated: r.anon_id === anonId(),
    remote: true,
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

export interface NewReportInput {
  category: ReportCategory;
  severity: Severity;
  title: string;
  body: string;
  city: string;
  photo?: string;
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
    createdAt: Date.now(),
    category: input.category,
    severity: input.severity,
    title: input.title.trim(),
    body: input.body.trim(),
    photo: input.photo,
    status: "pending",
    upvotes: 0,
    comments: 0,
    userCreated: true,
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
    lat: null,
    lon: null,
    category: input.category,
    severity: input.severity,
    title: report.title,
    body: report.body,
  });

  // A refusal is an answer, not an outage: falling back to localStorage here
  // would show the user a success toast for a report the database declined.
  if (!result.ok && result.reason === "rate-limited") {
    throw new RateLimitError(result.scope);
  }

  if (result.ok) {
    // Keep a local copy too: the photo lives only on this device (the
    // table stores no image), and it keeps the feed populated offline.
    const merged: Report = { ...fromRemote(result.row), photo: input.photo, userCreated: true };
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

/**
 * Read an image File and return a downscaled JPEG data URL so a photo can
 * persist in localStorage without blowing the quota. Rejects on non-images
 * or read failures.
 */
export function downscaleImage(file: File, max = 520, quality = 0.72): Promise<string> {
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
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Image processing isn't supported here."));
          return;
        }
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}
