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
import { aqiBandLabel, cityName, type Locale } from "./i18n";
import { communityText } from "./communityText";

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
  locale: Locale = "en",
): Promise<AiContext | null> {
  const near = nearestStation(report, stations);
  const t = communityText(locale).ai;
  const band = (aqi: number) => aqiBandLabel(aqiBand(aqi).label, locale);
  const city = (s: Station) => cityName(s.id, s.name, locale);

  /* ── Air and industrial: the nearest open-data air-quality value ── */
  if (report.category === "air" || report.category === "industrial") {
    if (!near) return null;
    if (!live || !near.station.liveAir) {
      // The modeled baseline must never be quoted as though an instrument
      // had produced it. Saying nothing beats saying something unsourced.
      return null;
    }
    const { station, km } = near;
    // Open-Meteo's CAMS value is a model estimate for a grid point, not a
    // station reading — the wording says so in every language.
    const where = km === 0 ? t.airAt(city(station)) : t.airNear(city(station), km1(km));

    return {
      kind: "air",
      text: t.airText(where, station.aqi, band(station.aqi), station.pm25, station.no2, report.category === "industrial"),
      source: t.airSource(city(station), new Date(fetchedAt ?? Date.now()).toUTCString()),
      fetchedAt: fetchedAt ?? Date.now(),
      station: { name: station.name, km },
    };
  }

  /* ── Biodiversity: the GBIF occurrence signal ── */
  if (report.category === "biodiversity") {
    if (!near) return null;
    const bio = await fetchCityBiodiversity(near.station, signal);
    /* Null here is a failed lookup, not an empty area: GBIF answers 200
       with count 0 for somewhere genuinely unsurveyed, so the only way to
       get null is the request itself failing. Returning null would make
       that indistinguishable from "this category has nothing to show" and
       the card would render no bubble at all — the silent failure this
       block was caught by once already. Throw, so the caller can say so. */
    if (!bio) throw new Error("GBIF occurrence lookup failed");
    const capped = bio.speciesCapped ? `${bio.species}+` : `${bio.species}`;

    return {
      kind: "biodiversity",
      text: t.bioText(
        RADIUS_KM,
        city(near.station),
        bio.records.toLocaleString("en-US"),
        capped,
        YEARS_BACK,
        bio.fromYear,
        bio.toYear,
      ),
      source: t.bioSource(RADIUS_KM, bio.fromYear, bio.toYear),
      fetchedAt: Date.now(),
      station: { name: near.station.name, km: near.km },
    };
  }

  /* ── Water and waste: no live feed exists, and that is the context ── */
  return {
    kind: "none",
    text: report.category === "water" ? t.water : t.waste,
    source: t.noneSource,
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
export function assistantPrompt(report: Report, ctx: AiContext | null, locale: Locale = "ru"): string {
  const stations = getStations();
  const near = nearestStation(report, stations);
  const place = near ? cityName(near.station.id, near.station.name, locale) : report.city;
  const aqi = ctx?.kind === "air" ? ctx.text.match(/US AQI (\d+)/)?.[1] : undefined;

  const P = {
    ru: {
      subject: {
        air: "загрязнение воздуха",
        water: "загрязнение воды",
        waste: "свалку",
        biodiversity: "наблюдение за биоразнообразием",
        industrial: "промышленные выбросы",
      },
      readings: (a: string) => ` Открытые данные для этого места сейчас показывают ${a} US AQI.`,
      q: (subj: string, sev: string, title: string, rd: string) =>
        `Житель сообщает про ${subj} — ${place}, критичность «${sev}»: «${title}».${rd} ` +
        `Насколько это опасно для здоровья при текущих показателях по этой локации, и что стоит сделать?`,
    },
    en: {
      subject: {
        air: "air pollution",
        water: "water pollution",
        waste: "illegal dumping",
        biodiversity: "a biodiversity observation",
        industrial: "industrial pollution",
      },
      readings: (a: string) => ` Open data for this place currently shows ${a} US AQI.`,
      q: (subj: string, sev: string, title: string, rd: string) =>
        `A resident reports ${subj} in ${place}, severity "${sev}": "${title}".${rd} ` +
        `How much of a health risk is this at the current values for this location, and what should be done?`,
    },
    kk: {
      subject: {
        air: "ауаның ластануы",
        water: "судың ластануы",
        waste: "қоқыс үйіндісі",
        biodiversity: "биоалуантүрлілікті бақылау",
        industrial: "өнеркәсіптік ластану",
      },
      readings: (a: string) => ` Бұл жер үшін ашық деректер қазір ${a} US AQI көрсетеді.`,
      q: (subj: string, sev: string, title: string, rd: string) =>
        `Тұрғын ${place} қаласындағы ${subj} туралы хабарлайды, маңыздылығы «${sev}»: «${title}».${rd} ` +
        `Осы жердегі ағымдағы көрсеткіштер кезінде бұл денсаулыққа қаншалықты қауіпті және не істеу керек?`,
    },
  }[locale];

  return P.q(P.subject[report.category], report.severity, report.title, aqi ? P.readings(aqi) : "");
}
