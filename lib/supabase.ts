/* ─────────────────────────────────────────────────────────────
   AETHERIS · Supabase persistence for community field reports
   ─────────────────────────────────────────────────────────────
   Plain fetch against PostgREST rather than @supabase/supabase-js: the
   site already talks to Open-Meteo and GBIF this way, the whole surface
   used here is two HTTP calls, and it keeps ~50 KB out of the bundle.

   The key below is Supabase's *publishable* key. It is designed to ship
   in client code — every protection lives in the row-level security
   policies in supabase/reports.sql, not in key secrecy. A `sb_secret_`
   key must never appear here.

   Everything degrades: if the project is unreachable or the table is
   missing, the caller falls back to localStorage and the app behaves
   exactly as it did before. A write the database declines (RLS, a
   constraint, a trigger) is not an outage: it is reported as refused and
   nothing is kept, because a local copy would never sync. That
   fallback is why the "no backend" copy stays until persistence is
   actually verified.
   ───────────────────────────────────────────────────────────── */

export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://effxsftaolpjjlpuqwax.supabase.co";

export const SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_KEY ??
  "sb_publishable_YERf0Mpcy2YhOFyvIz5H1w_rQ9-H6go";

export const REPORTS_TABLE = "reports";

export const isConfigured = () => Boolean(SUPABASE_URL && SUPABASE_KEY);

/**
 * Columns a visitor may read. supabase/privacy-hardening.sql grants SELECT
 * on exactly these — anon_id is deliberately absent — so `select=*` is
 * refused once that file is applied. Every read names them.
 */
export const REPORT_PUBLIC_COLUMNS = [
  "id",
  "created_at",
  "author",
  "city",
  "lat",
  "lon",
  "category",
  "severity",
  "title",
  "body",
  "status",
  "upvotes",
  "forwarded_at",
  "forwarded_to",
  "org_response",
  "org_response_org",
  "org_response_at",
  "parent_id",
  "photo_quality",
].join(",");

/** Two decimals ≈ 1 km — the most precise position the platform stores. */
export const COORD_DECIMALS = 2;
export function coarsen(v: number | null | undefined): number | null {
  if (v == null || !Number.isFinite(v)) return null;
  const f = 10 ** COORD_DECIMALS;
  return Math.round(v * f) / f;
}

/**
 * POST to a database function. Resolves to null when the function does not
 * exist yet (PostgREST answers 404) — the caller then uses the path that
 * works against a database without privacy-hardening.sql.
 */
export async function callRpc(
  fn: string,
  body: Record<string, unknown>,
  signal?: AbortSignal,
): Promise<Response | null> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(body),
    signal,
  });
  return res.status === 404 ? null : res;
}

function headers(extra: Record<string, string> = {}) {
  return {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    "Content-Type": "application/json",
    ...extra,
  };
}

/**
 * Status values the database can hold.
 *
 * The first three are the Community 2.0 vocabulary from
 * supabase/community-2.sql; the last three are the pre-2.0 values, kept in
 * the type because a database that has not had the migration applied still
 * answers with them. lib/reports.ts maps both onto one display vocabulary,
 * which is what lets the site run either way.
 */
export type RemoteStatus =
  | "submitted"
  | "corroborated"
  | "forwarded"
  | "org-response"
  /* legacy, pre-migration */
  | "pending"
  | "cross-checking"
  | "verified";

/** Shape stored in Postgres — see supabase/reports.sql + community-2.sql. */
export interface RemoteReport {
  id: string;
  created_at: string;
  /** Not readable by visitors since privacy-hardening.sql. */
  anon_id?: string;
  author: string;
  city: string;
  lat: number | null;
  lon: number | null;
  category: "air" | "water" | "waste" | "biodiversity" | "industrial";
  severity: "low" | "moderate" | "high" | "critical";
  title: string;
  body: string;
  status: RemoteStatus;
  upvotes: number;

  /* ── Added by community-2.sql. Every one of these is optional in the
     type because `select=*` against an unmigrated table simply will not
     return them, and that has to be a supported state rather than a
     crash. ── */

  /** ④ Передано — set only by mark_report_forwarded(). */
  forwarded_at?: string | null;
  forwarded_to?: string | null;
  /** ⑤ Ответ организации — set only by record_org_response(). */
  org_response?: string | null;
  org_response_org?: string | null;
  org_response_at?: string | null;
  /** Follow-up on one's own earlier report. */
  parent_id?: string | null;
  /** Photo passed the client-side sharpness/size check. */
  photo_quality?: boolean | null;
}

export type NewRemoteReport = { anon_id: string } & Omit<
  RemoteReport,
  | "id"
  | "created_at"
  | "anon_id"
  | "author"
  | "status"
  | "upvotes"
  | "forwarded_at"
  | "forwarded_to"
  | "org_response"
  | "org_response_org"
  | "org_response_at"
>;

/**
 * Columns that exist only after community-2.sql has been run. An insert
 * naming one of these against an unmigrated table is rejected outright, so
 * insertRemoteReport strips them and retries rather than losing the report.
 */
const MIGRATION_ONLY_COLUMNS = ["parent_id", "photo_quality"] as const;

/** Newest reports first. Returns null on any failure — never throws. */
export async function listRemoteReports(
  limit = 50,
  signal?: AbortSignal,
): Promise<RemoteReport[] | null> {
  if (!isConfigured()) return null;
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/${REPORTS_TABLE}?select=${REPORT_PUBLIC_COLUMNS}&order=created_at.desc&limit=${limit}`,
      { headers: headers(), signal },
    );
    if (!res.ok) return null;
    return (await res.json()) as RemoteReport[];
  } catch {
    return null;
  }
}

/**
 * Result of an insert. "rate-limited" has to be distinguishable from
 * "unavailable": the first is a real answer from the server that the user
 * must be told about, the second is a transport failure we quietly absorb
 * by writing locally. Collapsing them would mean telling someone their
 * report was filed when the database refused it.
 */
export type InsertResult =
  | { ok: true; row: RemoteReport }
  | { ok: false; reason: "rate-limited"; scope: "hourly" | "daily" }
  | { ok: false; reason: "refused"; code: string }
  | { ok: false; reason: "unavailable" };

/** One POST attempt. Separated so the caller can retry with fewer columns. */
async function postReport(
  report: Record<string, unknown>,
  signal?: AbortSignal,
): Promise<InsertResult | "unknown-column"> {
  // The explicit select matters: return=representation otherwise asks for
  // every column back, including anon_id, which visitors cannot read.
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${REPORTS_TABLE}?select=${REPORT_PUBLIC_COLUMNS}`, {
    method: "POST",
    // Prefer: return=representation gives back the inserted row, so the
    // UI shows the server's id and timestamp rather than guessing.
    headers: headers({ Prefer: "return=representation" }),
    body: JSON.stringify(report),
    signal,
  });

  if (res.ok) {
    const rows = (await res.json()) as RemoteReport[];
    return rows[0] ? { ok: true, row: rows[0] } : { ok: false, reason: "unavailable" };
  }

  // The rate-limit trigger raises P0001 with a message we tagged.
  const body = (await res.json().catch(() => null)) as
    | { code?: string; message?: string }
    | null;
  const msg = body?.message ?? "";
  if (msg.includes("rate_limit_hourly")) {
    return { ok: false, reason: "rate-limited", scope: "hourly" };
  }
  if (msg.includes("rate_limit_daily")) {
    return { ok: false, reason: "rate-limited", scope: "daily" };
  }

  // PostgREST answers PGRST204 for a column its schema cache does not know.
  // That means community-2.sql has not been run — recoverable, not an outage.
  if (
    body?.code === "PGRST204" ||
    MIGRATION_ONLY_COLUMNS.some((c) => msg.includes(`'${c}'`) || msg.includes(`"${c}"`))
  ) {
    return "unknown-column";
  }

  // Any other 4xx is the database declining this row — a pin outside the
  // coverage area, a follow-up to someone else's report, a check
  // constraint. That is an answer, not an outage: saying "unreachable" and
  // keeping it on the device would promise a sync that will never happen.
  // 404 stays "unavailable": it means the table is missing, which the
  // device-only fallback exists for.
  if (res.status >= 400 && res.status < 500 && res.status !== 404) {
    return { ok: false, reason: "refused", code: body?.code ?? String(res.status) };
  }

  return { ok: false, reason: "unavailable" };
}

/**
 * Insert one report. Never throws.
 *
 * Retries once without the community-2.sql columns if the database has not
 * had that migration applied. Dropping `photo_quality` costs the submitter
 * a 5-point bonus; dropping the whole report would cost them the report.
 */
export async function insertRemoteReport(
  report: NewRemoteReport,
  signal?: AbortSignal,
): Promise<InsertResult> {
  if (!isConfigured()) return { ok: false, reason: "unavailable" };
  try {
    const first = await postReport(report as unknown as Record<string, unknown>, signal);
    if (first !== "unknown-column") return first;

    const lean = { ...(report as unknown as Record<string, unknown>) };
    for (const c of MIGRATION_ONLY_COLUMNS) delete lean[c];
    const second = await postReport(lean, signal);
    return second === "unknown-column" ? { ok: false, reason: "unavailable" } : second;
  } catch {
    return { ok: false, reason: "unavailable" };
  }
}

/**
 * Which of these ids still exist in the table.
 *
 * Asked about specific ids rather than inferred from the feed page on
 * purpose: listRemoteReports caps at 50 rows, so "absent from the feed"
 * and "deleted" stop meaning the same thing as soon as the feed is longer
 * than that. Returns null on any failure, so a caller can tell "confirmed
 * gone" apart from "could not check" and leave the data alone.
 */
export async function existingReportIds(
  ids: string[],
  signal?: AbortSignal,
): Promise<Set<string> | null> {
  if (!isConfigured()) return null;
  if (ids.length === 0) return new Set();
  try {
    const list = ids.map((i) => `"${i}"`).join(",");
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/${REPORTS_TABLE}?select=id&id=in.(${list})`,
      { headers: headers(), signal },
    );
    if (!res.ok) return null;
    const rows = (await res.json()) as Array<{ id: string }>;
    return new Set(rows.map((r) => r.id));
  } catch {
    return null;
  }
}

/**
 * Delete one of this device's own reports. "unsupported" means the database
 * predates privacy-hardening.sql and has no way to prove ownership.
 */
export async function deleteRemoteReport(
  reportId: string,
  anonId: string,
): Promise<"deleted" | "refused" | "unsupported" | "unavailable"> {
  if (!isConfigured()) return "unavailable";
  try {
    const res = await callRpc("delete_my_report", { p_report_id: reportId, p_anon_id: anonId });
    if (!res) return "unsupported";
    if (!res.ok) return "unavailable";
    return (await res.json()) === true ? "deleted" : "refused";
  } catch {
    return "unavailable";
  }
}

/** True when the table exists and is readable — used to decide whether the
 *  UI may claim reports persist. */
export async function backendReachable(signal?: AbortSignal): Promise<boolean> {
  return (await listRemoteReports(1, signal)) !== null;
}

/**
 * Date the shared datastore went live. Nothing exists before it, so the
 * counter below is a true running total rather than a backfilled estimate.
 */
export const TRACKING_SINCE = "2026-07-25";

/**
 * Exact row count, read from the Content-Range header rather than by
 * downloading rows. Returns null on failure so the UI can stay silent
 * instead of printing a zero it cannot stand behind.
 */
export async function countRemoteReports(signal?: AbortSignal): Promise<number | null> {
  if (!isConfigured()) return null;
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/${REPORTS_TABLE}?select=id`,
      { method: "HEAD", headers: headers({ Prefer: "count=exact" }), signal },
    );
    if (!res.ok) return null;
    // Content-Range looks like "0-24/137"; the total is after the slash.
    const total = res.headers.get("content-range")?.split("/")[1];
    const n = total ? Number(total) : NaN;
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}
