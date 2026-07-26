/* ─────────────────────────────────────────────────────────────
   AETHERIS · GBIF species-occurrence signal
   ─────────────────────────────────────────────────────────────
   The second genuinely live layer, alongside Open-Meteo air quality.

   Source: GBIF (Global Biodiversity Information Facility) occurrence
   search — api.gbif.org/v1/occurrence/search. Free, no API key, and it
   sends `Access-Control-Allow-Origin: *`, so a static export can call it
   straight from the browser exactly the way lib/live.ts calls Open-Meteo.

   What this measures, stated plainly, because it is easy to overclaim:

     records  — occurrence records published to GBIF within RADIUS_KM of
                the city over the last YEARS_BACK years. This is a
                RECORDING-EFFORT signal as much as an ecological one: a
                well-surveyed city scores high partly because people
                looked. It is real, live and citable, and it is not an
                abundance measure.

     species  — distinct species among those records. Genuinely a
                richness signal, but the API returns facet buckets rather
                than a distinct count, so it is capped at SPECIES_CAP and
                flagged `speciesCapped` when the ceiling is hit. Almaty
                exceeds 1200; Aralsk returns ~149 uncapped.

   It does NOT replace the modeled Biodiversity Intactness Index. BII
   stays modeled and stays badged Modeled; this arrives beside it as a
   separate, live figure. See /methodology.
   ───────────────────────────────────────────────────────────── */

import type { Station } from "./data";

/** Search radius around each city centroid. */
export const RADIUS_KM = 50;
/** How far back occurrence records are counted. */
export const YEARS_BACK = 10;
/** Facet ceiling — species counts at or above this are reported as "N+". */
export const SPECIES_CAP = 500;

const ENDPOINT = "https://api.gbif.org/v1/occurrence/search";

export interface CityBiodiversity {
  stationId: string;
  /** Occurrence records in window. Recording effort as much as ecology. */
  records: number;
  /** Distinct species, capped at SPECIES_CAP. */
  species: number;
  /** True when `species` hit the cap and the real value is higher. */
  speciesCapped: boolean;
  /** Window actually queried, for display. */
  fromYear: number;
  toYear: number;
}

export interface GbifResult {
  /** Keyed by station id. Empty when the fetch failed entirely. */
  byCity: Record<string, CityBiodiversity>;
  /** True when at least one city returned real data. */
  live: boolean;
  fetchedAt: number | null;
}

function windowYears() {
  const to = new Date().getUTCFullYear();
  return { fromYear: to - YEARS_BACK, toYear: to };
}

function url(lat: number, lon: number) {
  const { fromYear, toYear } = windowYears();
  const q = new URLSearchParams({
    geoDistance: `${lat},${lon},${RADIUS_KM}km`,
    year: `${fromYear},${toYear}`,
    facet: "speciesKey",
    facetLimit: String(SPECIES_CAP),
    facetMincount: "1",
    // We only need the count and the facet buckets, never the rows.
    limit: "0",
  });
  return `${ENDPOINT}?${q}`;
}

/** One city. Resolves to null rather than throwing, so a partial outage
 *  degrades to "modeled only" instead of breaking the page. */
export async function fetchCityBiodiversity(
  station: Station,
  signal?: AbortSignal,
): Promise<CityBiodiversity | null> {
  try {
    const res = await fetch(url(station.lat, station.lon), { signal });
    if (!res.ok) return null;
    const json = (await res.json()) as {
      count?: number;
      facets?: { field: string; counts: { name: string; count: number }[] }[];
    };
    const buckets = json.facets?.[0]?.counts ?? [];
    const { fromYear, toYear } = windowYears();
    return {
      stationId: station.id,
      records: typeof json.count === "number" ? json.count : 0,
      species: buckets.length,
      speciesCapped: buckets.length >= SPECIES_CAP,
      fromYear,
      toYear,
    };
  } catch {
    return null;
  }
}

/** All cities in parallel, mirroring how lib/live.ts batches Open-Meteo. */
export async function fetchAllBiodiversity(
  stations: Station[],
  signal?: AbortSignal,
): Promise<GbifResult> {
  const settled = await Promise.all(
    stations.map((s) => fetchCityBiodiversity(s, signal)),
  );
  const byCity: Record<string, CityBiodiversity> = {};
  for (const r of settled) if (r) byCity[r.stationId] = r;
  const live = Object.keys(byCity).length > 0;
  return { byCity, live, fetchedAt: live ? Date.now() : null };
}

/** Attribution string, in the same shape the Open-Meteo notes use. */
export function gbifSource(b: CityBiodiversity | null): string {
  if (!b) return "GBIF occurrence search (live feed pending)";
  return `GBIF occurrence search · ${RADIUS_KM} km radius · ${b.fromYear}–${b.toYear} · ${b.records.toLocaleString("en-US")} records`;
}
