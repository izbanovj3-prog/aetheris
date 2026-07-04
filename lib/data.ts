/* ─────────────────────────────────────────────────────────────
   AETHERIS · Kazakhstan environmental simulation engine
   Deterministic, seeded national telemetry across every region.
   Air + weather are already LIVE via Open-Meteo/CAMS (lib/live.ts);
   the remaining generators are shaped 1:1 like target public feeds —
   MODIS-FIRMS (steppe fire), Copernicus (climate), GBIF (biodiversity)
   — so each live feed can swap in without touching UI.
   ───────────────────────────────────────────────────────────── */

export type LayerKey =
  | "air"
  | "industrial"
  | "water"
  | "biodiversity"
  | "risk";

export type CityKind =
  | "capital"
  | "metropolis"
  | "industrial"
  | "resource"
  | "regional";

export interface Station {
  id: string;
  name: string;
  region: string; // oblast / region
  kind: CityKind;
  lat: number;
  lon: number;
  population: number;
  aqi: number; // 0–300 (US EPA scale)
  pm25: number; // µg/m³
  pm10: number; // µg/m³
  no2: number; // ppb
  temperature: number; // °C, current reading
  humidity: number; // %
  waterQuality: number; // 0–100 WQI
  biodiversity: number; // 0–100 BII
  industrialEmissions: number; // 0–100 emission-load index
  pollutionIndex: number; // 0–100 composite pollution
  climateRisk: number; // 0–100 exposure
  sustainability: number; // 0–100 composite
  tempAnomaly: number; // °C vs 1991–2020 baseline
  trend: "improving" | "stable" | "declining";
}

export type HotspotType =
  | "industrial"
  | "water"
  | "radiation"
  | "wildfire"
  | "desertification"
  | "oilgas";

export interface Hotspot {
  id: string;
  name: string;
  type: HotspotType;
  region: string;
  lat: number;
  lon: number;
  severity: number; // 0–100
  status: "critical" | "elevated" | "monitored" | "recovering";
  detail: string;
}

/* ── Seeded RNG ───────────────────────────────────────────── */

export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const hash = (s: string) =>
  [...s].reduce((h, c) => (Math.imul(h, 31) + c.charCodeAt(0)) | 0, 7);

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

/* ── National city network ────────────────────────────────────
   [name, region, lat, lon, kind, air, water, climate, population]
   air     0 clean → 1 heavy (drives AQI / PM / NO₂ / emissions)
   water   0 pristine → 1 stressed (drives WQI down)
   climate 0 low → 1 high exposure (drives risk up, biodiversity down)
   Biases calibrated to real reputations: Almaty winter smog, the
   Temirtau steel belt, the Aral basin, the Caspian oil zone, etc. */

type CityDef = [string, string, number, number, CityKind, number, number, number, number];

const CITIES: CityDef[] = [
  ["Almaty", "Almaty", 43.238, 76.889, "metropolis", 0.85, 0.36, 0.55, 2_200_000],
  ["Astana", "Akmola", 51.169, 71.449, "capital", 0.52, 0.4, 0.45, 1_350_000],
  ["Shymkent", "Shymkent", 42.317, 69.588, "metropolis", 0.62, 0.46, 0.55, 1_100_000],
  ["Karaganda", "Karaganda", 49.806, 73.085, "industrial", 0.74, 0.5, 0.45, 500_000],
  ["Aktobe", "Aktobe", 50.279, 57.207, "industrial", 0.64, 0.48, 0.42, 530_000],
  ["Atyrau", "Atyrau", 47.094, 51.923, "resource", 0.66, 0.62, 0.6, 360_000],
  ["Aktau", "Mangystau", 43.651, 51.157, "resource", 0.58, 0.7, 0.68, 200_000],
  ["Pavlodar", "Pavlodar", 52.287, 76.967, "industrial", 0.78, 0.46, 0.4, 360_000],
  ["Semey", "Abai", 50.411, 80.227, "regional", 0.55, 0.52, 0.72, 350_000],
  ["Taraz", "Jambyl", 42.9, 71.367, "industrial", 0.58, 0.5, 0.55, 360_000],
  ["Kokshetau", "Akmola", 53.284, 69.395, "regional", 0.36, 0.34, 0.34, 175_000],
  ["Turkistan", "Turkistan", 43.297, 68.251, "regional", 0.5, 0.58, 0.62, 165_000],
  ["Oral", "West Kazakhstan", 51.227, 51.387, "regional", 0.5, 0.55, 0.45, 330_000],
  ["Kostanay", "Kostanay", 53.214, 63.624, "regional", 0.44, 0.42, 0.38, 250_000],
  ["Petropavl", "North Kazakhstan", 54.872, 69.163, "regional", 0.4, 0.4, 0.32, 220_000],
  ["Kyzylorda", "Kyzylorda", 44.842, 65.509, "regional", 0.54, 0.82, 0.8, 330_000],
  ["Oskemen", "East Kazakhstan", 49.948, 82.628, "industrial", 0.82, 0.58, 0.48, 340_000],
  ["Temirtau", "Karaganda", 50.054, 72.964, "industrial", 0.92, 0.62, 0.46, 170_000],
  ["Ekibastuz", "Pavlodar", 51.729, 75.327, "industrial", 0.8, 0.5, 0.42, 145_000],
  ["Zhezkazgan", "Ulytau", 47.783, 67.766, "resource", 0.66, 0.55, 0.58, 90_000],
  ["Balkhash", "Karaganda", 46.843, 74.98, "industrial", 0.76, 0.72, 0.62, 75_000],
  ["Rudny", "Kostanay", 52.962, 63.126, "resource", 0.6, 0.44, 0.4, 130_000],
  ["Zhanaozen", "Mangystau", 43.341, 52.86, "resource", 0.6, 0.75, 0.7, 150_000],
  ["Aralsk", "Kyzylorda", 46.799, 61.667, "regional", 0.48, 0.95, 0.9, 35_000],
  ["Kentau", "Turkistan", 43.518, 68.508, "resource", 0.56, 0.6, 0.6, 90_000],
  ["Ridder", "East Kazakhstan", 50.342, 83.512, "industrial", 0.7, 0.5, 0.48, 50_000],
  ["Satbayev", "Ulytau", 47.901, 67.541, "resource", 0.64, 0.55, 0.58, 65_000],
  ["Stepnogorsk", "Akmola", 52.35, 71.882, "industrial", 0.62, 0.45, 0.4, 45_000],
];

export function getStations(seed = 20260613): Station[] {
  return CITIES.map(([name, region, lat, lon, kind, air, water, climate, population]) => {
    const r = mulberry32(hash(name) ^ seed);
    const jit = (amp: number) => (r() - 0.5) * amp;

    const aqi = clamp(Math.round(14 + air * 205 + jit(40)), 8, 300);
    const pm25 = clamp(Math.round((4 + air * 115 + jit(28)) * 10) / 10, 2, 200);
    const pm10 = clamp(Math.round(pm25 * (1.5 + r() * 0.35) * 10) / 10, 4, 360);
    const no2 = clamp(Math.round((5 + air * 52 + jit(18)) * 10) / 10, 2, 90);
    const temperature = Math.round((31 - (lat - 43) * 0.8 + jit(5)) * 10) / 10;
    const humidity = clamp(Math.round(34 + (1 - climate) * 22 - air * 6 + jit(10)), 14, 78);
    const waterQuality = clamp(Math.round(96 - water * 78 + jit(10)), 8, 99);
    const biodiversity = clamp(Math.round(86 - climate * 46 - air * 16 + jit(12)), 6, 95);
    const industrialEmissions = clamp(
      Math.round(air * 70 + (kind === "industrial" ? 18 : kind === "resource" ? 10 : 0) + jit(10)),
      4,
      98,
    );
    const pollutionIndex = clamp(Math.round(aqi * 0.18 + industrialEmissions * 0.5 + no2 * 0.3 + jit(6)), 5, 99);
    const climateRisk = clamp(Math.round(20 + climate * 68 + jit(12)), 5, 97);
    const sustainability = clamp(
      Math.round(
        0.28 * (100 - aqi / 3) +
          0.18 * waterQuality +
          0.18 * biodiversity +
          0.16 * (100 - climateRisk) +
          0.2 * (100 - pollutionIndex),
      ),
      8,
      96,
    );
    const tempAnomaly = Math.round((1.3 + climate * 1.3 + (r() - 0.3) * 0.8) * 100) / 100;
    const t = r();

    return {
      id: name.toLowerCase().replace(/[^a-z]+/g, "-"),
      name,
      region,
      kind,
      lat,
      lon,
      population,
      aqi,
      pm25,
      pm10,
      no2,
      temperature,
      humidity,
      waterQuality,
      biodiversity,
      industrialEmissions,
      pollutionIndex,
      climateRisk,
      sustainability,
      tempAnomaly,
      trend: t < 0.33 ? "improving" : t < 0.72 ? "stable" : "declining",
    };
  });
}

/* ── Environmental hotspots — industrial zones, eco-risk sites,
   steppe wildfire and water emergencies, anchored to real places. */

export const HOTSPOTS: Hotspot[] = [
  { id: "h-aral", name: "Aral Sea Basin", type: "desertification", region: "Kyzylorda", lat: 45.3, lon: 59.5, severity: 95, status: "critical", detail: "Exposed seabed; salt-and-dust storms across the former shoreline" },
  { id: "h-balkhash", name: "Lake Balkhash", type: "water", region: "Karaganda", lat: 46.3, lon: 74.5, severity: 72, status: "elevated", detail: "Inflow decline and rising salinity threaten the western basin" },
  { id: "h-tengiz", name: "Tengiz / Caspian Shelf", type: "oilgas", region: "Atyrau", lat: 46.2, lon: 53.2, severity: 78, status: "elevated", detail: "Associated-gas flaring and H₂S; sturgeon habitat under pressure" },
  { id: "h-karachaganak", name: "Karachaganak Field", type: "oilgas", region: "West Kazakhstan", lat: 51.37, lon: 51.66, severity: 70, status: "monitored", detail: "Condensate field flaring within a populated sanitary zone" },
  { id: "h-polygon", name: "Semipalatinsk Polygon", type: "radiation", region: "Abai", lat: 50.0, lon: 78.8, severity: 80, status: "monitored", detail: "Legacy nuclear-test ground; residual contamination on the steppe" },
  { id: "h-temirtau", name: "Temirtau Steelworks", type: "industrial", region: "Karaganda", lat: 50.05, lon: 72.95, severity: 90, status: "critical", detail: "Integrated steel plant — persistent particulate and SO₂ load" },
  { id: "h-ekibastuz", name: "Ekibastuz Coal Complex", type: "industrial", region: "Pavlodar", lat: 51.67, lon: 75.37, severity: 84, status: "elevated", detail: "Two of the largest coal-fired stations in Central Asia" },
  { id: "h-oskemen", name: "Oskemen Metallurgy", type: "industrial", region: "East Kazakhstan", lat: 49.95, lon: 82.62, severity: 82, status: "elevated", detail: "Lead-zinc smelting in a valley prone to winter inversions" },
  { id: "h-almaty", name: "Almaty Smog Basin", type: "industrial", region: "Almaty", lat: 43.24, lon: 76.91, severity: 76, status: "elevated", detail: "Mountain-trapped winter inversion concentrates traffic + heating emissions" },
  { id: "h-betpak", name: "Betpak-Dala Steppe Fires", type: "wildfire", region: "Ulytau", lat: 46.5, lon: 70.5, severity: 64, status: "monitored", detail: "Dry-season grassland fire front across the central steppe" },
  { id: "h-kostanay", name: "Kostanay Steppe Fires", type: "wildfire", region: "Kostanay", lat: 52.0, lon: 64.5, severity: 58, status: "recovering", detail: "Wheat-belt stubble and grassland ignitions, partly contained" },
  { id: "h-balksmelt", name: "Balkhash Copper Smelter", type: "industrial", region: "Karaganda", lat: 46.84, lon: 74.98, severity: 75, status: "elevated", detail: "Copper smelting SO₂ plume on the northern lake shore" },
  { id: "h-syrdarya", name: "Syr Darya Salinization", type: "water", region: "Kyzylorda", lat: 44.8, lon: 65.5, severity: 70, status: "monitored", detail: "Irrigation drawdown raises salinity along the lower river" },
  { id: "h-mangystau", name: "Mangystau Desert Stress", type: "desertification", region: "Mangystau", lat: 43.7, lon: 52.5, severity: 66, status: "monitored", detail: "Arid plateau with acute freshwater scarcity and land degradation" },
];

/* ── Time series ──────────────────────────────────────────── */

export interface SeriesPoint {
  t: number; // index
  v: number;
}

/** Smooth pseudo-random walk for charts. */
export function genSeries(
  key: string,
  n: number,
  base: number,
  amp: number,
  drift = 0,
): SeriesPoint[] {
  const r = mulberry32(hash(key));
  const phase = r() * Math.PI * 2;
  const phase2 = r() * Math.PI * 2;
  const out: SeriesPoint[] = [];
  let noise = 0;
  for (let i = 0; i < n; i++) {
    noise = noise * 0.82 + (r() - 0.5) * amp * 0.55;
    const seasonal =
      Math.sin((i / n) * Math.PI * 2 + phase) * amp * 0.6 +
      Math.sin((i / n) * Math.PI * 6 + phase2) * amp * 0.22;
    out.push({
      t: i,
      v: Math.round((base + seasonal + noise + drift * i) * 100) / 100,
    });
  }
  return out;
}

/* ── Aggregates ───────────────────────────────────────────── */

export function aqiBand(aqi: number) {
  if (aqi <= 50) return { label: "Good", tone: "emerald" as const };
  if (aqi <= 100) return { label: "Moderate", tone: "cyan" as const };
  if (aqi <= 150) return { label: "Sensitive", tone: "amber" as const };
  if (aqi <= 200) return { label: "Unhealthy", tone: "amber" as const };
  return { label: "Hazardous", tone: "coral" as const };
}

export function scoreBand(v: number) {
  if (v >= 75) return { label: "Strong", tone: "emerald" as const };
  if (v >= 50) return { label: "Stable", tone: "cyan" as const };
  if (v >= 30) return { label: "Stressed", tone: "amber" as const };
  return { label: "Critical", tone: "coral" as const };
}

/** Live metrics fetched per city from Open-Meteo (see lib/live.ts). */
const LIVE_METRICS_PER_CITY = 6; // US AQI, PM2.5, PM10, NO₂, temperature, humidity
/** Open-Meteo "current" fields refresh hourly upstream (CAMS / forecast models). */
const UPSTREAM_REFRESHES_PER_DAY = 24;

/** Headline figures computed from the actual network — no marketing numbers. */
export function networkStats() {
  const stations = getStations();
  return {
    cities: stations.length,
    regions: new Set(stations.map((s) => s.region)).size,
    hotspots: HOTSPOTS.length,
    liveMetrics: LIVE_METRICS_PER_CITY,
    refreshesPerDay: UPSTREAM_REFRESHES_PER_DAY,
    dailyReadings:
      stations.length * LIVE_METRICS_PER_CITY * UPSTREAM_REFRESHES_PER_DAY,
  };
}

export function planetSummary(stations: Station[]) {
  const avg = (f: (s: Station) => number) =>
    stations.reduce((a, s) => a + f(s), 0) / stations.length;
  return {
    meanAqi: Math.round(avg((s) => s.aqi)),
    meanWater: Math.round(avg((s) => s.waterQuality)),
    meanBio: Math.round(avg((s) => s.biodiversity)),
    meanSustainability: Math.round(avg((s) => s.sustainability)),
    meanPollution: Math.round(avg((s) => s.pollutionIndex)),
    meanIndustrial: Math.round(avg((s) => s.industrialEmissions)),
    meanAnomaly: Math.round(avg((s) => s.tempAnomaly) * 100) / 100,
    hotspots: HOTSPOTS.length,
    criticalSites: HOTSPOTS.filter((h) => h.status === "critical").length,
  };
}

/* ── Layer styling shared by map + dashboard ─────────────── */

export const LAYERS: Record<
  LayerKey,
  { label: string; unit: string; color: string; describe: string }
> = {
  air: {
    label: "Air Quality",
    unit: "AQI",
    color: "#4fd8f7",
    describe: "PM2.5 / PM10 / NO₂ composite — live Open-Meteo (CAMS) readings over a modeled baseline",
  },
  industrial: {
    label: "Industrial Load",
    unit: "IEI",
    color: "#f57362",
    describe: "Emission load from metallurgy, coal power and oil-and-gas zones",
  },
  water: {
    label: "Water Quality",
    unit: "WQI",
    color: "#4f9dde",
    describe: "Surface-water index — turbidity, salinity and contaminant load",
  },
  biodiversity: {
    label: "Biodiversity",
    unit: "BII",
    color: "#2de2a6",
    describe: "Biodiversity intactness from steppe habitat and species observation",
  },
  risk: {
    label: "Environmental Risk",
    unit: "ERI",
    color: "#f5b352",
    describe: "Composite exposure: heat, drought, desertification and legacy contamination",
  },
};
