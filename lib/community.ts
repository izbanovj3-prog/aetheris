/* ─────────────────────────────────────────────────────────────
   AETHERIS · Community-sourced signal
   ─────────────────────────────────────────────────────────────
   Turns the real (non-seeded) field reports in Postgres into a per-city
   aggregate, so the feed stops being only a list and becomes a layer.

   This is the one signal on the platform that is neither an instrument
   feed nor a model: it is people saying what they saw. It is badged
   "Live · community" rather than "Live" precisely because "Live" on this
   site has meant instrument-grade (Open-Meteo/CAMS) and this is not that.

   What it is NOT, stated where the numbers are shown as well as here:
   anecdotal, self-reported, unverified against any instrument, and shaped
   by who happens to be looking. A city with no reports is not a clean
   city — it is a city nobody has reported from.

   Aggregation runs client-side over the rows in the window. At current
   volumes that is a single small request; if the feed ever grows past a
   few thousand rows in 30 days this should become a Postgres view.
   ───────────────────────────────────────────────────────────── */

import type { ReportCategory, Severity } from "./reports";
import { SUPABASE_KEY, SUPABASE_URL, isConfigured, REPORTS_TABLE } from "./supabase";

/** Rolling window the aggregate covers. */
export const WINDOW_DAYS = 30;

export interface CitySignal {
  city: string;
  /** Real reports in the window. Zero is a real answer, not missing data. */
  total: number;
  byCategory: Record<ReportCategory, number>;
  bySeverity: Record<Severity, number>;
  /** Distinct devices that filed — one person filing five is not five voices. */
  reporters: number;
  /** Most recent report in the window, epoch ms. */
  latest: number | null;
  windowDays: number;
}

const emptyCategory = (): Record<ReportCategory, number> => ({
  air: 0,
  water: 0,
  waste: 0,
  biodiversity: 0,
  industrial: 0,
});

const emptySeverity = (): Record<Severity, number> => ({
  low: 0,
  moderate: 0,
  high: 0,
  critical: 0,
});

export function emptySignal(city: string): CitySignal {
  return {
    city,
    total: 0,
    byCategory: emptyCategory(),
    bySeverity: emptySeverity(),
    reporters: 0,
    latest: null,
    windowDays: WINDOW_DAYS,
  };
}

interface Row {
  city: string;
  category: ReportCategory;
  severity: Severity;
  anon_id: string;
  created_at: string;
}

/**
 * Aggregate for every city at once — one request, since the map and the
 * city pages both want it. Returns null if the datastore is unreachable,
 * so the UI can distinguish "nobody has reported" from "we cannot tell".
 */
export async function fetchCommunitySignals(
  signal?: AbortSignal,
): Promise<Record<string, CitySignal> | null> {
  if (!isConfigured()) return null;
  const since = new Date(Date.now() - WINDOW_DAYS * 86_400_000).toISOString();
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/${REPORTS_TABLE}` +
        `?select=city,category,severity,anon_id,created_at` +
        `&created_at=gte.${since}&limit=2000`,
      {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
        },
        signal,
      },
    );
    if (!res.ok) return null;
    const rows = (await res.json()) as Row[];

    const out: Record<string, CitySignal> = {};
    const devices: Record<string, Set<string>> = {};

    for (const r of rows) {
      // The submission form picks the city from the station list, so this
      // key lines up with Station.name without any fuzzy matching.
      const key = r.city;
      out[key] ??= emptySignal(key);
      devices[key] ??= new Set();

      out[key].total += 1;
      if (r.category in out[key].byCategory) out[key].byCategory[r.category] += 1;
      if (r.severity in out[key].bySeverity) out[key].bySeverity[r.severity] += 1;
      devices[key].add(r.anon_id);

      const ts = new Date(r.created_at).getTime();
      if (!out[key].latest || ts > out[key].latest) out[key].latest = ts;
    }

    for (const key of Object.keys(out)) out[key].reporters = devices[key].size;
    return out;
  } catch {
    return null;
  }
}

/** Attribution string in the same shape the Open-Meteo and GBIF notes use. */
export function communitySource(sig: CitySignal | null): string {
  if (!sig || sig.total === 0) {
    return `Aetheris community reports · last ${WINDOW_DAYS} days · no reports filed for this city yet. Self-reported and unverified; absence of reports is not evidence of absence of a problem.`;
  }
  return `Aetheris community reports · ${sig.total} report${sig.total === 1 ? "" : "s"} from ${sig.reporters} device${sig.reporters === 1 ? "" : "s"} in the last ${WINDOW_DAYS} days. Self-reported and unverified against instruments; counts reflect who is looking as much as what is happening.`;
}
