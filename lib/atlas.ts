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
export function buildEvents(): AtlasEvent[] {
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
      text: `AQI ${s.aqi} ▲ — ${s.aqi > 200 ? "hazardous air" : "elevated particulates"}`,
      place: s.name,
    });
  }
  for (const h of HOTSPOTS.filter((x) => x.severity >= 70)) {
    ev.push({
      id: `hot-${h.id}`,
      severity: h.status === "critical" ? "alert" : "watch",
      glyph: HOTSPOT_GLYPH[h.type] ?? "⬡",
      text: `${h.name} — severity ${h.severity}/100 · ${h.status}`,
      place: h.region,
    });
  }
  for (const s of byImproving.slice(0, 3)) {
    ev.push({
      id: `imp-${s.id}`,
      severity: "positive",
      glyph: "✦",
      text: `Sustainability ▲ ${s.sustainability}/100 — improving`,
      place: s.name,
    });
  }
  for (const s of byWater.slice(0, 2)) {
    ev.push({
      id: `wq-${s.id}`,
      severity: "watch",
      glyph: "◈",
      text: `Water quality ${s.waterQuality}/100 — treatment pressure`,
      place: s.name,
    });
  }
  for (const s of byBio.slice(0, 2)) {
    ev.push({
      id: `bio-${s.id}`,
      severity: "positive",
      glyph: "❋",
      text: `Biodiversity intactness ${s.biodiversity}/100 — recovering steppe`,
      place: s.name,
    });
  }
  ev.push({
    id: "aral",
    severity: "alert",
    glyph: "◷",
    text: "Aral seabed dust index +18% — salt-storm season intensifying",
    place: "Kyzylorda",
  });
  ev.push({
    id: "balkhash",
    severity: "watch",
    glyph: "≈",
    text: "Lake Balkhash inflow −9% vs decadal mean",
    place: "Karaganda",
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
export function planetNarrative(p: PlanetPulse): string {
  if (p.health >= 70)
    return "National vitals stable — northern air improving, industrial zones holding within limits.";
  if (p.health >= 50)
    return "Mixed signals — winter inversions building over Almaty and the Karaganda steel belt.";
  return "Stress elevated — Aral dust, smelter plumes and heat exposure compounding across regions.";
}

export type StationLite = Pick<Station, "name" | "aqi" | "sustainability">;
