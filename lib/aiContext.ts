/* ─────────────────────────────────────────────────────────────
   AETHERIS · AI-контекст for community field reports
   ─────────────────────────────────────────────────────────────
   Status ② of the Community 2.0 ladder. Aetheris Analyst reads a report's
   category and location and puts comparable live data beside it.

   The line this file will not cross: what comes back is context, never a
   verdict. Every sentence below is written so it cannot be read as the
   platform agreeing with, checking, or endorsing a report. Nothing here
   says "confirms", "verified", "proves" or "consistent with" — the last
   one included, because "consistent with" is a verdict wearing a hedge.
   The bubble states what an instrument recorded near that place, states
   what the report claims, and leaves the reader to hold the two together.

   What is actually available, on the stack that already exists:

     • Air and Industrial → the nearest live Open-Meteo / CAMS air-quality
       reading, via the same fetch the landing page and city pages use
       (lib/live.ts, deduplicated in lib/useLiveStations.ts).
     • Biodiversity → the GBIF occurrence signal for that area, via the
       same call the city pages make (lib/gbif.ts).
     • Water and Waste → nothing. No free real-time point feed covering
       Kazakhstan at this granularity has been identified for either, and
       the bubble says exactly that rather than reaching for a proxy.

   Explicitly NOT built, and not stubbed: pixel-level cross-checking of a
   photo against satellite imagery. The concept flags it as unavailable —
   the project has no access to commercial archives at the resolution and
   revisit rate that would need — and a placeholder implying otherwise
   would be worse than its absence.

   The reading is fetched now, not at filing time. For a report filed
   minutes ago that is the same thing; for one filed last week it is not,
   so the bubble timestamps itself and says so.
   ───────────────────────────────────────────────────────────── */

import { aqiBand, getStations, type Station } from "./data";
import { fetchCityBiodiversity, RADIUS_KM, YEARS_BACK } from "./gbif";
import type { Report } from "./reports";

/** Beyond this, the nearest station is too far to be worth quoting. */
export const MAX_STATION_KM = 120;

export interface AiContext {
  /** Which feed answered — drives the attribution line under the bubble. */
  kind: "air" | "biodiversity" | "none";
  /** The context sentence(s) shown in the bubble. */
  text: string;
  /** Source attribution, in the same shape the SourceNote markers use. */
  source: string;
  /** When the underlying reading was taken, epoch ms. */
  fetchedAt: number;
  /** Station the reading came from, when there is one. */
  station?: { name: string; km: number };
}

function haversineKm(
  aLat: number,
  aLon: number,
  bLat: number,
  bLon: number,
): number {
  const r = 6371;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLon = ((bLon - aLon) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((aLat * Math.PI) / 180) *
      Math.cos((bLat * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return r * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
}

/**
 * The station a report's context should come from.
 *
 * Coordinates win when the flow captured them — that is the whole point of
 * the draggable pin. Otherwise fall back to the city label, which the
 * submission flow picks from this same station list, so it matches
 * exactly without any fuzzy matching.
 */
export function nearestStation(
  r: Pick<Report, "city" | "lat" | "lon">,
  stations: Station[],
): { station: Station; km: number } | null {
  if (typeof r.lat === "number" && typeof r.lon === "number") {
    let best: { station: Station; km: number } | null = null;
    for (const s of stations) {
      const km = haversineKm(r.lat, r.lon, s.lat, s.lon);
      if (!best || km < best.km) best = { station: s, km };
    }
    return best && best.km <= MAX_STATION_KM ? best : null;
  }
  const byName = stations.find((s) => s.name === r.city);
  return byName ? { station: byName, km: 0 } : null;
}

const km1 = (km: number) => (km < 1 ? "<1" : km.toFixed(1));

/**
 * Build the context for one report.
 *
 * `stations` should be the live-enriched list from useLiveStations, so the
 * AQI quoted is the real current reading rather than the modeled baseline.
 * Returns null only when there is nothing truthful to say at all.
 */
export async function buildAiContext(
  report: Report,
  stations: Station[],
  live: boolean,
  fetchedAt: number | null,
  signal?: AbortSignal,
): Promise<AiContext | null> {
  const near = nearestStation(report, stations);

  /* ── Air and industrial: the nearest live air-quality reading ── */
  if (report.category === "air" || report.category === "industrial") {
    if (!near) return null;
    if (!live) {
      // The modeled baseline must never be quoted as though an instrument
      // had produced it. Saying nothing beats saying something unsourced.
      return null;
    }
    const { station, km } = near;
    const band = aqiBand(station.aqi);
    const where =
      km === 0
        ? `The ${station.name} station`
        : `The nearest air-quality station (${station.name}, ${km1(km)} km away)`;

    return {
      kind: "air",
      text:
        `${where} currently reads US AQI ${station.aqi} (${band.label}), ` +
        `PM2.5 ${station.pm25} µg/m³ and NO₂ ${station.no2} ppb. ` +
        `This is a reading from near the reported location, not a check on the report: ` +
        `the station measures its own air, which may differ from what was seen at the exact spot, ` +
        `and it says nothing about ${report.category === "industrial" ? "the source of what was seen" : "the cause of it"}.`,
      source: `Open-Meteo Air Quality API (CAMS) · ${station.name} · read ${new Date(fetchedAt ?? Date.now()).toUTCString()}`,
      fetchedAt: fetchedAt ?? Date.now(),
      station: { name: station.name, km },
    };
  }

  /* ── Biodiversity: the GBIF occurrence signal ── */
  if (report.category === "biodiversity") {
    if (!near) return null;
    const bio = await fetchCityBiodiversity(near.station, signal);
    if (!bio) return null;
    const capped = bio.speciesCapped ? `${bio.species}+` : `${bio.species}`;

    return {
      kind: "biodiversity",
      text:
        `Within ${RADIUS_KM} km of ${near.station.name}, GBIF holds ` +
        `${bio.records.toLocaleString("en-US")} occurrence records covering ${capped} distinct species ` +
        `from the last ${YEARS_BACK} years (${bio.fromYear}–${bio.toYear}). ` +
        `That is a record of what people have published from this area, so it reflects how much surveying ` +
        `has happened as much as what lives there. It is background for reading this report, not a check on it.`,
      source: `GBIF occurrence search · ${RADIUS_KM} km radius · ${bio.fromYear}–${bio.toYear}`,
      fetchedAt: Date.now(),
      station: { name: near.station.name, km: near.km },
    };
  }

  /* ── Water and waste: no live feed exists, and that is the context ── */
  return {
    kind: "none",
    text:
      report.category === "water"
        ? "No live water-quality feed covering Kazakhstan at this granularity has been identified, so there is no instrument reading to place beside this report. The Water Quality Index shown elsewhere on the platform is modeled, not measured, and quoting a modeled number here would suggest a check that did not happen."
        : "There is no live feed for waste and dumping — no instrument network measures it. Nothing can be placed beside this report except other people's reports from the same area.",
    source: "Aetheris Analyst · no live source available for this category",
    fetchedAt: Date.now(),
  };
}

/**
 * The prompt the "Спросить ИИ" button hands to /assistant.
 *
 * Written as a question from the reader, carrying the report's category,
 * location and whatever readings are on screen, so the Analyst answers
 * about this report rather than about the city in general.
 */
export function assistantPrompt(report: Report, ctx: AiContext | null): string {
  const stations = getStations();
  const near = nearestStation(report, stations);
  const place = near ? near.station.name : report.city;

  const readings =
    ctx?.kind === "air" && ctx.station
      ? ` Ближайшая станция (${ctx.station.name}) сейчас показывает ${ctx.text.match(/US AQI (\d+)/)?.[1] ?? "—"} US AQI.`
      : "";

  const subject: Record<Report["category"], string> = {
    air: "загрязнение воздуха",
    water: "загрязнение воды",
    waste: "свалку",
    biodiversity: "наблюдение за биоразнообразием",
    industrial: "промышленные выбросы",
  };

  return (
    `Житель сообщает про ${subject[report.category]} — ${place}, критичность «${report.severity}»: ` +
    `«${report.title}».${readings} ` +
    `Насколько это опасно для здоровья при текущих показателях по этой локации, и что стоит сделать?`
  );
}
