/* ─────────────────────────────────────────────────────────────
   AETHERIS · Atlas live intelligence (Kazakhstan)
   Derives a believable national event stream + a country health
   index from the same simulation the map renders — so the "live
   feed" is grounded in real station + hotspot data, not noise.
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
    aral: "Aral seabed dust index +18% — salt-storm season intensifying",
    balkhash: "Lake Balkhash inflow −9% vs decadal mean",
  },
  ru: {
    aqi: (v: number, haz: boolean) => `AQI ${v} ▲ — ${haz ? "опасный воздух" : "повышенные частицы"}`,
    hot: (name: string, sev: number, status: string) => `${name} — тяжесть ${sev}/100 · ${status}`,
    improving: (v: number) => `Устойчивость ▲ ${v}/100 — улучшается`,
    water: (v: number) => `Качество воды ${v}/100 — нагрузка на очистку`,
    bio: (v: number) => `Сохранность биоразнообразия ${v}/100 — степь восстанавливается`,
    aral: "Индекс аральской пыли +18% — сезон солевых бурь усиливается",
    balkhash: "Приток в озеро Балхаш −9% к десятилетней норме",
  },
  kk: {
    aqi: (v: number, haz: boolean) => `AQI ${v} ▲ — ${haz ? "қауіпті ауа" : "жоғары бөлшектер"}`,
    hot: (name: string, sev: number, status: string) => `${name} — ауырлығы ${sev}/100 · ${status}`,
    improving: (v: number) => `Тұрақтылық ▲ ${v}/100 — жақсаруда`,
    water: (v: number) => `Су сапасы ${v}/100 — тазарту жүктемесі`,
    bio: (v: number) => `Биоалуантүрлілік сақталуы ${v}/100 — дала қалпына келуде`,
    aral: "Арал түбі шаңы индексі +18% — тұзды дауыл маусымы күшеюде",
    balkhash: "Балқаш көліне құйылу −9% онжылдық нормаға қатысты",
  },
} as const;

const ARAL_PLACE = { en: "Kyzylorda", ru: "Кызылорда", kk: "Қызылорда" };
const BALKHASH_PLACE = { en: "Karaganda", ru: "Караганда", kk: "Қарағанды" };

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
  ev.push({
    id: "aral",
    severity: "alert",
    glyph: "◷",
    text: f.aral,
    place: ARAL_PLACE[locale],
  });
  ev.push({
    id: "balkhash",
    severity: "watch",
    glyph: "≈",
    text: f.balkhash,
    place: BALKHASH_PLACE[locale],
  });

  // deterministic shuffle so the stream order is stable across reloads
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

/** Small bounded live drift around a base value (deterministic per tick). */
export function drift(base: number, amp: number, tick: number, phase = 0): number {
  return base + Math.sin(tick * 0.6 + phase) * amp * 0.6 + Math.sin(tick * 1.7 + phase) * amp * 0.4;
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
    "National vitals stable — northern air improving, industrial zones holding within limits.",
    "Mixed signals — winter inversions building over Almaty and the Karaganda steel belt.",
    "Stress elevated — Aral dust, smelter plumes and heat exposure compounding across regions.",
  ],
  ru: [
    "Национальные показатели стабильны — воздух на севере улучшается, промзоны в пределах нормы.",
    "Смешанные сигналы — зимние инверсии нарастают над Алматы и карагандинским стальным поясом.",
    "Нагрузка повышена — аральская пыль, плюмы заводов и жара накладываются по регионам.",
  ],
  kk: [
    "Ұлттық көрсеткіштер тұрақты — солтүстікте ауа жақсаруда, өнеркәсіп аймақтары шек ішінде.",
    "Аралас сигналдар — Алматы мен Қарағанды болат белдеуі үстінде қысқы инверсиялар күшеюде.",
    "Жүктеме жоғары — Арал шаңы, зауыт түтіні мен ыстық өңірлер бойынша жинақталуда.",
  ],
};
export function planetNarrative(p: PlanetPulse, locale: Locale = "en"): string {
  const n = NARRATIVE[locale];
  if (p.health >= 70) return n[0];
  if (p.health >= 50) return n[1];
  return n[2];
}

export type StationLite = Pick<Station, "name" | "aqi" | "sustainability">;
