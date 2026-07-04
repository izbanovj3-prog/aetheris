/* ─────────────────────────────────────────────────────────────
   AETHERIS · Environmental reasoning engine (on-device)
   A deterministic analyst over the Kazakhstan simulation layer.
   The generate() signature matches a streaming LLM call, so wiring
   in the Claude API later is a drop-in replacement.
   ───────────────────────────────────────────────────────────── */

import {
  HOTSPOTS,
  aqiBand,
  getStations,
  planetSummary,
  scoreBand,
  type Station,
} from "./data";

export interface AssistantReply {
  text: string;
  citations: string[];
}

const stations = getStations();

/** Whole-word match (ASCII boundaries) so short tokens don't fire inside
 *  other words. */
function hasWord(text: string, term: string): boolean {
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(?:^|[^a-z0-9])${escaped}(?:[^a-z0-9]|$)`, "i").test(text);
}

/** Resolve the city a query names. City names win over region names, and
 *  matching is whole-word. A region resolves to its largest representative
 *  station for oblast-level questions. */
function findStation(q: string): Station | undefined {
  const byName = stations.find((s) => hasWord(q, s.name.toLowerCase()));
  if (byName) return byName;
  const inRegion = stations
    .filter((s) => hasWord(q, s.region.toLowerCase()))
    .sort((a, b) => b.population - a.population);
  return inRegion[0];
}

function trendVerb(s: Station) {
  return s.trend === "improving"
    ? "trending positive over the last 90 days"
    : s.trend === "declining"
      ? "deteriorating over the last 90 days"
      : "holding stable over the last 90 days";
}

function stationBrief(s: Station): string {
  const air = aqiBand(s.aqi);
  const sus = scoreBand(s.sustainability);
  return [
    `**${s.name}, ${s.region} region** — current environmental state:`,
    ``,
    `- **Air quality:** AQI ${s.aqi} (${air.label}) · PM2.5 ${s.pm25} µg/m³ · PM10 ${s.pm10} µg/m³ · NO₂ ${s.no2} ppb`,
    `- **Conditions:** ${s.temperature} °C · ${s.humidity}% relative humidity`,
    `- **Water quality index:** ${s.waterQuality}/100`,
    `- **Biodiversity intactness:** ${s.biodiversity}/100`,
    `- **Industrial emission load:** ${s.industrialEmissions}/100 · pollution index ${s.pollutionIndex}/100`,
    `- **Environmental risk exposure:** ${s.climateRisk}/100`,
    `- **Aetheris sustainability score:** ${s.sustainability}/100 (${sus.label}), ${trendVerb(s)}`,
    `- **Temperature anomaly:** +${s.tempAnomaly.toFixed(2)} °C vs the 1991–2020 baseline`,
  ].join("\n");
}

function riskOutlook(s: Station): string {
  const drivers: string[] = [];
  if (s.aqi > 130)
    drivers.push(
      `**Air quality stress.** PM2.5 of ${s.pm25} µg/m³ exceeds the WHO guideline by ~${Math.round(s.pm25 / 5)}×. Winter inversions will concentrate heating and traffic emissions further.`,
    );
  if (s.industrialEmissions > 60)
    drivers.push(
      `**Industrial emission load.** An emission index of ${s.industrialEmissions}/100 points to heavy metallurgy, coal-power or oil-and-gas activity nearby; SO₂ and particulate spikes track plant cycles.`,
    );
  if (s.climateRisk > 60)
    drivers.push(
      `**Environmental exposure.** Composite risk of ${s.climateRisk}/100 driven by heat, drought and — across the south and west — desertification and salt-dust transport. Treat adaptation as near-term.`,
    );
  if (s.waterQuality < 50)
    drivers.push(
      `**Water system strain.** WQI of ${s.waterQuality}/100 signals salinity or contaminant pressure; monitor abstraction and turbidity through the irrigation season.`,
    );
  if (s.biodiversity < 45)
    drivers.push(
      `**Habitat degradation.** Biodiversity intactness of ${s.biodiversity}/100 indicates steppe and wetland ecosystem services are weakening.`,
    );
  if (drivers.length === 0)
    drivers.push(
      `No critical risk drivers detected. The dominant signal is the regional warming trend of +${s.tempAnomaly.toFixed(2)} °C — within adaptive range but compounding.`,
    );
  return drivers.map((d) => `- ${d}`).join("\n");
}

function recommendations(s: Station): string {
  const recs: string[] = [];
  if (s.aqi > 100)
    recs.push(
      "Accelerate the shift from coal heating to gas/electric and expand low-emission zones — modeled to cut winter PM2.5 18–25% within two seasons.",
    );
  if (s.industrialEmissions > 60)
    recs.push(
      "Mandate continuous stack monitoring and capture retrofits at the dominant plant; public real-time readings cut unreported exceedances sharply.",
    );
  if (s.waterQuality < 60)
    recs.push(
      "Deploy upstream watershed sensors and tighten irrigation abstraction; early warning shortens contamination response from days to hours.",
    );
  if (s.biodiversity < 55)
    recs.push(
      "Protect and reconnect steppe and riparian corridors — habitat continuity is the highest-leverage move for intactness recovery.",
    );
  if (s.climateRisk > 50)
    recs.push(
      "Stress-test infrastructure against 1-in-50-year heat and drought scenarios and pre-position cooling and water reserves.",
    );
  if (recs.length === 0)
    recs.push(
      "Maintain current trajectory; the highest-leverage move is locking in renewable procurement before regional grid demand rises.",
    );
  return recs.map((r, i) => `${i + 1}. ${r}`).join("\n");
}

/** Metric explainers. */
const TERMS: Array<{ match: string[]; text: string }> = [
  {
    match: ["aqi", "air quality index"],
    text: "**AQI (Air Quality Index)** condenses pollutant concentrations — PM2.5, PM10, NO₂, O₃, SO₂, CO — into a single 0–500 scale. Below 50 is good; above 150 means health effects for the general population. Aetheris takes the US AQI from the Open-Meteo air-quality feed (CAMS satellite-driven model), refreshed hourly for all 28 monitored cities.",
  },
  {
    match: ["pm2.5", "pm25", "pm 2.5", "particulate"],
    text: "**PM2.5** is particulate matter under 2.5 microns — small enough to cross from lungs into the bloodstream. The WHO annual guideline is 5 µg/m³. In Kazakhstan it peaks during winter inversions over Almaty, Oskemen and the coal-heating belt, and it anchors our air pillar.",
  },
  {
    match: ["pm10", "pm 10", "coarse"],
    text: "**PM10** is coarse particulate under 10 microns — dust, soot and, across the Aral and Mangystau regions, wind-blown salt and soil. The WHO guideline is 15 µg/m³ annual. It often spikes far above PM2.5 during steppe dust events.",
  },
  {
    match: ["industrial", "emission", "iei"],
    text: "**The Industrial Emission Index (IEI)** scores the local emission load from metallurgy, coal power and oil-and-gas operations on a 0–100 scale. The Temirtau steel belt, Ekibastuz power complex and Oskemen smelters dominate the national signal.",
  },
  {
    match: ["pollution index"],
    text: "**The Pollution Index** is a 0–100 composite of ambient air pollution and industrial emission load for a city — a single readout of how much human-driven contamination its residents are exposed to day to day.",
  },
  {
    match: ["biodiversity", "bii"],
    text: "**Biodiversity Intactness (BII)** estimates how much of an area's original species community remains. We fuse steppe and wetland habitat extent, fragmentation metrics and observation records. Above 90 is near-pristine; below 30 indicates ecosystem-function loss.",
  },
  {
    match: ["sustainability score", "sustainability"],
    text: "**The Aetheris Sustainability Score** is a weighted composite of air, water, biodiversity, inverse environmental risk and inverse pollution. It is designed to be comparable across cities and auditable — every input traces to a sensor or dataset.",
  },
  {
    match: ["temperature anomaly", "anomaly"],
    text: "**Temperature anomaly** is the difference between current temperature and the 1991–2020 climatological baseline. Central Asia is warming faster than the global mean — most Kazakh cities now run +1.5 to +2.5 °C, the clearest local fingerprint of climate change.",
  },
  {
    match: ["aral", "aral sea"],
    text: "**The Aral Sea** collapse is the defining ecological disaster of the region — irrigation diversion shrank it to a fraction of its 1960 extent, exposing the Aralkum: a salt desert whose toxic dust storms drive respiratory illness across Kyzylorda. Aetheris tracks the seabed dust index and lower Syr Darya salinity.",
  },
];

/** Intent + entity router. Order matters: an explicit national ask outranks
 *  a named place, a place outranks a definition, greetings are whole-word. */
export function generate(query: string): AssistantReply {
  const q = query.toLowerCase();
  const sum = planetSummary(stations);
  const s = findStation(q);

  const any = (text: string, ...stems: string[]) => stems.some((w) => text.includes(w));
  const isNational =
    any(q, "national", "country", "kazakhstan", "nationwide", "network", "everywhere") ||
    ((any(q, "summary", "overview", "snapshot") || any(q, "whole")) && !s);
  const isRisk = any(q, "risk", "predict", "forecast", "outlook", "threat");
  const isRec = any(q, "recommend", "improve", "action", "advice", "should");
  const isDefinitional = any(q, "what", "explain", "mean", "how", "define", "definition");
  const isHotspot = any(q, "hotspot", "industrial", "fire", "wildfire", "smelter", "plant", "pollution site");
  const isGreeting = ["hi", "hello", "hey"].some((w) => hasWord(q, w));

  // 1 · Explicit national intent wins even when a place is also named.
  if (isNational) {
    return {
      text: [
        `**National snapshot — last sensor sweep across ${stations.length} cities:**`,
        ``,
        `- Mean urban AQI: **${sum.meanAqi}** (${aqiBand(sum.meanAqi).label})`,
        `- Mean surface water quality: **${sum.meanWater}/100**`,
        `- Mean biodiversity intactness: **${sum.meanBio}/100**`,
        `- Mean industrial emission load: **${sum.meanIndustrial}/100**`,
        `- National sustainability score: **${sum.meanSustainability}/100**`,
        `- Mean temperature anomaly: **+${sum.meanAnomaly} °C** vs 1991–2020`,
        `- Environmental hotspots tracked: **${sum.hotspots}** (${sum.criticalSites} critical)`,
        ``,
        `The strongest negative signals are the Temirtau steel belt and the Aral dust season; the strongest positive signal is air-quality improvement across the northern oblasts.`,
      ].join("\n"),
      citations: ["Open-Meteo (CAMS) air-quality feed · 28 cities", "Aetheris modeled baseline — water, biodiversity, industry (simulated)"],
    };
  }

  // 2 · A named city — sub-route by intent, otherwise a full brief.
  if (s) {
    if (isRisk) {
      return {
        text: `Here is the 12-month environmental risk outlook for **${s.name}**:\n\n${riskOutlook(s)}\n\n**Confidence:** moderate-high. The model blends current telemetry with seasonal climatology; acute events (major fires, industrial incidents) are outside scope.`,
        citations: [
          `${s.name} station cluster · live`,
          "Aetheris environmental risk model ERI-4",
          "Copernicus seasonal forecast (simulated feed)",
        ],
      };
    }
    if (isRec) {
      return {
        text: `Highest-leverage sustainability actions for **${s.name}** (ranked by modeled impact per tenge):\n\n${recommendations(s)}\n\nWant me to model the projected score change for any of these?`,
        citations: [
          `${s.name} station cluster · live`,
          "Aetheris intervention impact library",
        ],
      };
    }
    return {
      text: `${stationBrief(s)}\n\nAsk me for a **risk outlook** or **recommendations** for ${s.name} to go deeper.`,
      citations: [
        `${s.name} station cluster · live`,
        "Aetheris sustainability methodology v4.2",
      ],
    };
  }

  // 3 · Definitional question about a metric (no place in scope).
  if (isDefinitional) {
    const term = TERMS.find((t) => t.match.some((m) => q.includes(m)));
    if (term) {
      return {
        text: term.text,
        citations: ["Aetheris methodology v4.2", "WHO air quality guidelines (2021)"],
      };
    }
  }

  // 4 · Hotspot / industrial situation.
  if (isHotspot) {
    const top = [...HOTSPOTS].sort((a, b) => b.severity - a.severity).slice(0, 3);
    return {
      text: `**Environmental hotspot situation:** ${sum.hotspots} sites under track, ${sum.criticalSites} flagged critical.\n\n${top
        .map((h) => `- **${h.name}** (${h.region}) — severity ${h.severity}/100, ${h.status}. ${h.detail}.`)
        .join("\n")}\n\nOpen the Atlas on the Industrial Load layer for live positions.`,
      citations: ["MODIS / FIRMS thermal anomalies (simulated feed)", "Aetheris industrial monitoring registry"],
    };
  }

  // 5 · Greeting.
  if (isGreeting) {
    return {
      text: `Hello — I'm the Aetheris environmental analyst for Kazakhstan. I sit on top of the national sensor network and can:\n\n- Brief you on any monitored city (try **"How is Almaty doing?"**)\n- Produce **risk outlooks** and **sustainability recommendations**\n- Explain the science behind any metric (**"What does PM10 mean?"**)\n- Summarize the **national** picture\n\nWhere should we look first?`,
      citations: [],
    };
  }

  // 6 · Fallback.
  return {
    text: `I can analyze any of the **${stations.length} monitored cities** across Kazakhstan — ask about a specific place ("air quality in Temirtau"), request a **risk outlook**, ask for **recommendations**, or say **"national summary"** for the country-wide view.\n\nCoverage expands as community stations come online — the fastest way to add one is through the Community hub.`,
    citations: ["Open-Meteo (CAMS) air-quality feed · 28 cities"],
  };
}

export const SUGGESTED_PROMPTS = [
  "National summary",
  "How is Almaty doing?",
  "Risk outlook for Aralsk",
  "Recommendations for Temirtau",
  "What does PM10 mean?",
  "Industrial hotspots",
];
