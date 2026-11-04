/* ─────────────────────────────────────────────────────────────
   AETHERIS · Atlas model overview (Kazakhstan)
   A list of notable values and a composite index, derived from the same
   simulation the map renders. Everything here is MODELLED: it is shown
   under a "model" label, never with live timestamps, and never animated
   to look like a feed. Statements that no data behind the site supports
   (the former Aral-dust and Balkhash-inflow percentages) were removed.
   ───────────────────────────────────────────────────────────── */

import {
  HOTSPOTS,
  getStations,
  mulberry32,
  planetSummary,
  type Station,
} from "./data";
import {
  cityName,
  hotspotName,
  regionShort,
  statusLabel,
  type Locale,
} from "./i18n";

/* Event text templates per locale — filled from live station/hotspot data. */
const FEED = {
  en: {
    aqi: (v: number, haz: boolean) => `AQI ${v} ▲ — ${haz ? "hazardous air" : "elevated particulates"}`,
    hot: (name: string, sev: number, status: string) => `${name} — severity ${sev}/100 · ${status}`,
    improving: (v: number) => `Sustainability ▲ ${v}/100 — improving`,
    water: (v: number) => `Water quality ${v}/100 — treatment pressure`,
    bio: (v: number) => `Biodiversity intactness ${v}/100 — recovering steppe`,
  },
  ru: {
    aqi: (v: number, haz: boolean) => `AQI ${v} ▲ — ${haz ? "опасный воздух" : "повышенные частицы"}`,
    hot: (name: string, sev: number, status: string) => `${name} — тяжесть ${sev}/100 · ${status}`,
    improving: (v: number) => `Устойчивость ▲ ${v}/100 — улучшается`,
    water: (v: number) => `Качество воды ${v}/100 — нагрузка на очистку`,
    bio: (v: number) => `Сохранность биоразнообразия ${v}/100 — степь восстанавливается`,
  },
  kk: {
    aqi: (v: number, haz: boolean) => `AQI ${v} ▲ — ${haz ? "қауіпті ауа" : "жоғары бөлшектер"}`,
    hot: (name: string, sev: number, status: string) => `${name} — ауырлығы ${sev}/100 · ${status}`,
    improving: (v: number) => `Тұрақтылық ▲ ${v}/100 — жақсаруда`,
    water: (v: number) => `Су сапасы ${v}/100 — тазарту жүктемесі`,
    bio: (v: number) => `Биоалуантүрлілік сақталуы ${v}/100 — дала қалпына келуде`,
  },
} as const;


export type EventSeverity = "alert" | "watch" | "positive" | "info";

export interface AtlasEvent {
  id: string;
  severity: EventSeverity;
  glyph: string;
  text: string;
  place: string;
}

const stations = getStations();

const HOTSPOT_GLYPH: Record<string, string> = {
  industrial: "⬡",
  water: "◈",
  radiation: "☢",
  wildfire: "🔥",
  desertification: "◷",
  oilgas: "◬",
};

/** Build the event pool once from the actual station + hotspot data. */
export function buildEvents(locale: Locale = "en"): AtlasEvent[] {
  const f = FEED[locale];
  const ev: AtlasEvent[] = [];
  const byAqi = [...stations].sort((a, b) => b.aqi - a.aqi);
  const byImproving = stations.filter((s) => s.trend === "improving");
  const byWater = [...stations].sort((a, b) => a.waterQuality - b.waterQuality);
  const byBio = [...stations].sort((a, b) => b.biodiversity - a.biodiversity);

  for (const s of byAqi.slice(0, 4)) {
    ev.push({
      id: `aqi-${s.id}`,
      severity: s.aqi > 200 ? "alert" : "watch",
      glyph: "◬",
      text: f.aqi(s.aqi, s.aqi > 200),
      place: cityName(s.id, s.name, locale),
    });
  }
  for (const h of HOTSPOTS.filter((x) => x.severity >= 70)) {
    ev.push({
      id: `hot-${h.id}`,
      severity: h.status === "critical" ? "alert" : "watch",
      glyph: HOTSPOT_GLYPH[h.type] ?? "⬡",
      text: f.hot(hotspotName(h.id, h.name, locale), h.severity, statusLabel(h.status, locale)),
      place: regionShort(h.region, locale),
    });
  }
  for (const s of byImproving.slice(0, 3)) {
    ev.push({
      id: `imp-${s.id}`,
      severity: "positive",
      glyph: "✦",
      text: f.improving(s.sustainability),
      place: cityName(s.id, s.name, locale),
    });
  }
  for (const s of byWater.slice(0, 2)) {
    ev.push({
      id: `wq-${s.id}`,
      severity: "watch",
      glyph: "◈",
      text: f.water(s.waterQuality),
      place: cityName(s.id, s.name, locale),
    });
  }
  for (const s of byBio.slice(0, 2)) {
    ev.push({
      id: `bio-${s.id}`,
      severity: "positive",
      glyph: "❋",
      text: f.bio(s.biodiversity),
      place: cityName(s.id, s.name, locale),
    });
  }

  // deterministic shuffle so the order is stable across reloads
  const r = mulberry32(424242);
  for (let i = ev.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [ev[i], ev[j]] = [ev[j], ev[i]];
  }
  return ev;
}

export interface PlanetPulse {
  health: number; // 0–100 composite national health index
  meanAqi: number;
  anomaly: number;
  hotspots: number;
  critical: number;
}

/** Base national pulse from the simulation summary. */
export function basePulse(): PlanetPulse {
  const sum = planetSummary(stations);
  // health = sustainability-weighted, penalised by anomaly + pollution load
  const health = Math.round(
    clamp(
      sum.meanSustainability * 0.7 +
        (100 - sum.meanAqi / 3) * 0.2 +
        (100 - sum.meanAnomaly * 22) * 0.1,
      0,
      100,
    ),
  );
  return {
    health,
    meanAqi: sum.meanAqi,
    anomaly: sum.meanAnomaly,
    hotspots: sum.hotspots,
    critical: sum.criticalSites,
  };
}


const SEVERITY_TONE: Record<EventSeverity, string> = {
  alert: "#f57362",
  watch: "#f5b352",
  positive: "#2de2a6",
  info: "#4fd8f7",
};
export function severityColor(s: EventSeverity): string {
  return SEVERITY_TONE[s];
}

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

/** A short, rotating national narrative line for the HUD headline. */
const NARRATIVE: Record<Locale, [string, string, string]> = {
  en: [
    "Model: national index steady — northern air improving, industrial load unchanged.",
    "Model: mixed — winter inversions expected over Almaty and the Karaganda steel belt.",
    "Model: elevated — dust, smelter emissions and heat exposure add up across regions.",
  ],
  ru: [
    "Модель: национальный индекс стабилен — воздух на севере улучшается, промышленная нагрузка без изменений.",
    "Модель: смешанная картина — над Алматы и карагандинским промышленным поясом ожидаются зимние инверсии.",
    "Модель: нагрузка повышена — пыль, выбросы заводов и жара накладываются по регионам.",
  ],
  kk: [
    "Модель: ұлттық индекс тұрақты — солтүстікте ауа жақсаруда, өнеркәсіптік жүктеме өзгеріссіз.",
    "Модель: аралас көрініс — Алматы мен Қарағанды өнеркәсіп белдеуі үстінде қысқы инверсиялар күтіледі.",
    "Модель: жүктеме жоғары — шаң, зауыт шығарындылары мен ыстық өңірлер бойынша жинақталуда.",
  ],
};
export function planetNarrative(p: PlanetPulse, locale: Locale = "en"): string {
  const n = NARRATIVE[locale];
  if (p.health >= 70) return n[0];
  if (p.health >= 50) return n[1];
  return n[2];
}

export type StationLite = Pick<Station, "name" | "aqi" | "sustainability">;
