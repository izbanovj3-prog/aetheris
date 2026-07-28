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

   Everything degrades: if the project is unreachable, the table is
   missing, or RLS rejects the write, the caller falls back to
   localStorage and the app behaves exactly as it did before. That
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

function headers(extra: Record<string, string> = {}) {
  return {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    "Content-Type": "application/json",
    ...extra,
  };
}

/** Shape stored in Postgres — see supabase/reports.sql. */
export interface RemoteReport {
  id: string;
  created_at: string;
  anon_id: string;
  author: string;
  city: string;
  lat: number | null;
  lon: number | null;
  category: "air" | "water" | "waste" | "biodiversity" | "industrial";
  severity: "low" | "moderate" | "high" | "critical";
  title: string;
  body: string;
  status: "pending" | "cross-checking" | "verified";
  upvotes: number;
}

export type NewRemoteReport = Omit<
  RemoteReport,
  "id" | "created_at" | "status" | "upvotes"
>;

/** Newest reports first. Returns null on any failure — never throws. */
export async function listRemoteReports(
  limit = 50,
  signal?: AbortSignal,
): Promise<RemoteReport[] | null> {
  if (!isConfigured()) return null;
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/${REPORTS_TABLE}?select=*&order=created_at.desc&limit=${limit}`,
      { headers: headers(), signal },
    );
    if (!res.ok) return null;
    return (await res.json()) as RemoteReport[];
  } catch {
    return null;
  }
}

/** Insert one report. Returns the stored row, or null if it did not persist. */
export async function insertRemoteReport(
  report: NewRemoteReport,
  signal?: AbortSignal,
): Promise<RemoteReport | null> {
  if (!isConfigured()) return null;
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${REPORTS_TABLE}`, {
      method: "POST",
      // Prefer: return=representation gives back the inserted row, so the
      // UI shows the server's id and timestamp rather than guessing.
      headers: headers({ Prefer: "return=representation" }),
      body: JSON.stringify(report),
      signal,
    });
    if (!res.ok) return null;
    const rows = (await res.json()) as RemoteReport[];
    return rows[0] ?? null;
  } catch {
    return null;
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
