/* ─────────────────────────────────────────────────────────────
   AETHERIS · Live data layer
   Enriches the deterministic simulation baseline with REAL, current
   readings from the Open-Meteo APIs (free, key-less, CORS-enabled):
     • Air Quality — US AQI, PM2.5, PM10, NO₂  (CAMS global model)
     • Weather     — temperature, relative humidity
   Both calls are batched (all 28 cities in one request each). On any
   failure we silently fall back to the simulated stations, so the UI
   never breaks. Water / biodiversity / industrial stay modeled — no
   free point feed exists for those yet.
   ───────────────────────────────────────────────────────────── */

import { getStations, type Station } from "./data";

const AQ_URL = "https://air-quality-api.open-meteo.com/v1/air-quality";
const WX_URL = "https://api.open-meteo.com/v1/forecast";

export interface LiveResult {
  stations: Station[];
  /** true when at least one real reading was applied */
  live: boolean;
  fetchedAt: number;
}

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

/** Recompute the composite scores that depend on air inputs, so a city's
 *  pollution index + sustainability stay consistent with its live AQI. */
function recompose(s: Station): Station {
  const pollutionIndex = clamp(
    Math.round(s.aqi * 0.18 + s.industrialEmissions * 0.5 + s.no2 * 0.3),
    5,
    99,
  );
  const sustainability = clamp(
    Math.round(
      0.28 * (100 - s.aqi / 3) +
        0.18 * s.waterQuality +
        0.18 * s.biodiversity +
        0.16 * (100 - s.climateRisk) +
        0.2 * (100 - pollutionIndex),
    ),
    8,
    96,
  );
  return { ...s, pollutionIndex, sustainability };
}

type Current = Record<string, number | string | undefined>;
const toArray = (j: unknown): Array<{ current?: Current }> =>
  Array.isArray(j) ? j : [j as { current?: Current }];
const num = (v: unknown): number | undefined =>
  typeof v === "number" && Number.isFinite(v) ? v : undefined;

/**
 * Fetch live air-quality + weather for the whole network and merge it over
 * the simulated baseline. Results map back to cities by request order.
 */
export async function fetchLiveStations(signal?: AbortSignal): Promise<LiveResult> {
  const base = getStations();
  try {
    const lat = base.map((s) => s.lat).join(",");
    const lon = base.map((s) => s.lon).join(",");
    const [aqRes, wxRes] = await Promise.all([
      fetch(`${AQ_URL}?latitude=${lat}&longitude=${lon}&current=us_aqi,pm2_5,pm10,nitrogen_dioxide`, { signal }),
      fetch(`${WX_URL}?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m`, { signal }),
    ]);
    if (!aqRes.ok || !wxRes.ok) throw new Error(`Open-Meteo HTTP ${aqRes.status}/${wxRes.status}`);

    const aq = toArray(await aqRes.json());
    const wx = toArray(await wxRes.json());
    let applied = 0;

    const stations = base.map((s, i) => {
      const a = aq[i]?.current;
      const w = wx[i]?.current;
      if (!a && !w) return s;
      applied++;

      const usAqi = num(a?.us_aqi);
      const pm25 = num(a?.pm2_5);
      const pm10 = num(a?.pm10);
      const no2ug = num(a?.nitrogen_dioxide); // µg/m³
      const temp = num(w?.temperature_2m);
      const hum = num(w?.relative_humidity_2m);

      const merged: Station = {
        ...s,
        aqi: usAqi != null ? clamp(Math.round(usAqi), 0, 500) : s.aqi,
        pm25: pm25 != null ? Math.round(pm25 * 10) / 10 : s.pm25,
        pm10: pm10 != null ? Math.round(pm10 * 10) / 10 : s.pm10,
        // Open-Meteo reports NO₂ in µg/m³; the app surfaces ppb (≈ µg/m³ ÷ 1.88).
        no2: no2ug != null ? Math.round((no2ug / 1.88) * 10) / 10 : s.no2,
        temperature: temp != null ? Math.round(temp * 10) / 10 : s.temperature,
        humidity: hum != null ? clamp(Math.round(hum), 0, 100) : s.humidity,
      };
      return recompose(merged);
    });

    return { stations, live: applied > 0, fetchedAt: Date.now() };
  } catch {
    return { stations: base, live: false, fetchedAt: Date.now() };
  }
}
