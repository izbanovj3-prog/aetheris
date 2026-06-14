/* ─────────────────────────────────────────────────────────────
   AETHERIS · Community field reports
   Domain model + a client-side persistence layer. Aetheris ships as
   a static site with no backend, so user reports persist to
   localStorage — real persistence that survives reloads. The API
   (createReport / getUserReports) is intentionally async and
   storage-agnostic, so swapping in a real endpoint later is a
   drop-in change with no UI rewrite.
   ───────────────────────────────────────────────────────────── */

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

export const STATUS_META: Record<ReportStatus, { label: string; tone: Tone }> = {
  verified: { label: "Verified", tone: "emerald" },
  "cross-checking": { label: "Cross-checking vs sensors", tone: "cyan" },
  pending: { label: "Awaiting review", tone: "amber" },
};

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
    body: "Grey band sitting over the southern districts toward the foothills. AirKaz station corroborates — PM2.5 spiked to 142 µg/m³ at 08:10 local.",
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
    body: "Rainbow film stretching ~200m downstream of the industrial outfall. Sample logged with kit #ATY-07; requesting Kazhydromet cross-check.",
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

/* ── Persistence (localStorage) ──────────────────────────────── */

const STORAGE_KEY = "aetheris.community.reports.v1";
const MAX_STORED = 40;

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
