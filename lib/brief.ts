/* ─────────────────────────────────────────────────────────────
   AETHERIS · City Action Brief — the "Act" layer
   ─────────────────────────────────────────────────────────────
   Sense → Reason → Act. The first two ship; this is the third, kept
   deliberately small and honest.

   Everything here is a RULE-BASED LOOKUP, not a model and not an AI
   recommendation. A city is matched to its dominant environmental
   stressor, and that stressor keys an explicit table of interventions
   written from published practice. Impact figures are order-of-magnitude
   planning estimates carried as ranges and labelled indicative
   everywhere they surface — they are NOT measured outcomes and not
   predictions for a specific city.

   No new data source: reads the same getStations() / HOTSPOTS the Atlas
   and dashboard already use.
   ───────────────────────────────────────────────────────────── */

import {
  HOTSPOTS,
  getStations,
  type Hotspot,
  type HotspotType,
  type Station,
} from "./data";

export interface Intervention {
  /** Short imperative title a city official can scan. */
  title: string;
  /** What is actually done, in one sentence. */
  action: string;
  /** Why this is the lever for this stressor. */
  rationale: string;
  /** Indicative, range-based. Never presented as measured. */
  impact: string;
  /** Rough time to first measurable effect. */
  horizon: string;
  /** Who has to act — briefs are read by people deciding ownership. */
  owner: string;
  /**
   * Ranking weight for this city, 0–1. Lets two cities with the same
   * stressor still get different orderings based on their own readings.
   */
  weight: (s: Station) => number;
}

const norm = (v: number) => Math.max(0, Math.min(1, v / 100));

/* ── The lookup table ─────────────────────────────────────────
   One entry per hotspot type. Deliberately specific: a brief that
   says the same thing for a steel town and a drying seabed is worth
   nothing to the person reading it. */

export const INTERVENTIONS: Record<HotspotType, Intervention[]> = {
  industrial: [
    {
      title: "Continuous stack monitoring at the dominant plant",
      action:
        "Mandate CEMS (continuous emission monitoring) on the largest stacks, with readings published hourly to a public endpoint.",
      rationale:
        "Unreported exceedances persist where self-reporting is periodic. Public continuous data changes plant behaviour before any fine is issued.",
      impact: "Typically 15–30% fewer unreported exceedance hours in year one",
      horizon: "6–12 months to first data",
      owner: "Oblast environmental inspectorate + plant operator",
      weight: (s) => norm(s.industrialEmissions),
    },
    {
      title: "Capture-and-retrofit incentive scheme",
      action:
        "Tie a tax-relief or co-financing package to baghouse, scrubber and fugitive-dust retrofits at the top three emitters.",
      rationale:
        "Retrofit capex, not intent, is the usual blocker. Co-financing moves the payback period inside a plant's planning horizon.",
      impact: "Indicative 10–20% reduction in local PM load over 2–3 seasons",
      horizon: "18–36 months",
      owner: "Ministry of Ecology + oblast akimat",
      weight: (s) => norm(s.pollutionIndex) * 0.9,
    },
    {
      title: "Enforce the sanitary protection zone",
      action:
        "Survey housing inside the plant's designated sanitary zone and fund relocation or shelter-in-place upgrades for residents who remain.",
      rationale:
        "Exposure is dominated by the households closest to the fence line; buffer enforcement cuts the worst individual doses fastest.",
      impact: "Largest per-person exposure reduction of the three; affects a small population",
      horizon: "2–5 years",
      owner: "City akimat + housing authority",
      weight: (s) => norm(s.aqi / 3) * 0.7,
    },
  ],

  desertification: [
    {
      title: "Irrigation efficiency retrofit on the feeder canals",
      action:
        "Line or pipe the highest-loss district canals and shift the served area to drip or sprinkler delivery.",
      rationale:
        "Open earthen canals lose a large share of diverted flow to seepage and evaporation before it reaches a field. Recovered flow is the cheapest new water available.",
      impact: "Indicative 15–25% reduction in diversion losses on retrofitted sections",
      horizon: "1–3 irrigation seasons",
      owner: "Basin water authority + district water users' association",
      weight: (s) => 1 - norm(s.waterQuality),
    },
    {
      title: "Saxaul planting on exposed seabed",
      action:
        "Extend phytomelioration belts of saxaul and salt-tolerant shrub across the highest-emission dust corridors upwind of settlements.",
      rationale:
        "Vegetated seabed binds the salt-dust that drives respiratory load and soil salinisation downwind; unplanted flats keep re-seeding the storms.",
      impact: "Indicative 20–40% local reduction in dust flux over planted corridors, once established",
      horizon: "3–7 years to establishment",
      owner: "Forestry committee + local akimat",
      weight: (s) => norm(s.climateRisk) * 0.95,
    },
    {
      title: "Meter and publish district water allocations",
      action:
        "Install offtake metering at district level and publish monthly abstraction against allocation.",
      rationale:
        "Allocation disputes stall efficiency work. Measured offtake turns an argument about blame into an argument about numbers.",
      impact: "Enabling step — no direct water saving, but a precondition for the other two",
      horizon: "6–18 months",
      owner: "Basin water authority",
      weight: (s) => 0.55 - norm(s.waterQuality) * 0.1,
    },
  ],

  water: [
    {
      title: "Contaminant tracing and source apportionment",
      action:
        "Run a synoptic sampling campaign up- and downstream of each suspected discharge, with isotopic or marker analysis to attribute load.",
      rationale:
        "A basin-level index says water is bad; it cannot say who is making it bad. Attribution is what makes enforcement possible.",
      impact: "Indicative: identifies the sources behind roughly 60–80% of measured load",
      horizon: "1–2 sampling seasons",
      owner: "Basin inspectorate + accredited laboratory",
      weight: (s) => 1 - norm(s.waterQuality),
    },
    {
      title: "Audit upstream discharge permits",
      action:
        "Re-examine every active discharge permit on the reach against current flow, and revoke or re-price those issued on obsolete assumptions.",
      rationale:
        "Permits written for historic flows become far more concentrated as flow declines — the paperwork stays legal while the river degrades.",
      impact: "Indicative 10–25% reduction in permitted load where flows have dropped materially",
      horizon: "12–24 months",
      owner: "Basin water authority + environmental prosecutor",
      weight: (s) => (1 - norm(s.waterQuality)) * 0.85,
    },
    {
      title: "Point-of-use treatment for affected settlements",
      action:
        "Deploy and maintain community-scale filtration at settlements whose only supply is the affected reach.",
      rationale:
        "Source remediation takes years. Point-of-use treatment protects health in the interim and does not depend on upstream compliance.",
      impact: "Immediate exposure reduction for connected households; does not improve the source",
      horizon: "3–9 months",
      owner: "City akimat + public health authority",
      weight: (s) => (1 - norm(s.waterQuality)) * 0.75,
    },
  ],

  wildfire: [
    {
      title: "Deploy early-detection coverage",
      action:
        "Combine satellite thermal-anomaly alerting with a small network of camera or sensor towers on the prevailing upwind approach.",
      rationale:
        "Steppe fire cost scales with time-to-detection, not with total suppression capacity. Minutes at ignition beat hours of response.",
      impact: "Indicative 30–50% reduction in mean detection time where coverage is added",
      horizon: "One fire season",
      owner: "Emergency situations department",
      weight: (s) => norm(s.climateRisk),
    },
    {
      title: "Pre-season firebreak maintenance",
      action:
        "Grade and clear the firebreak network around settlements and infrastructure before the dry season, on a published schedule.",
      rationale:
        "Firebreaks silt up and revegetate between seasons; an unmaintained break is a line on a map, not a barrier.",
      impact: "Indicative reduction in area burned per ignition; strongest around settlements",
      horizon: "Immediate, recurring annually",
      owner: "Forestry committee + district administration",
      weight: (s) => norm(s.climateRisk) * 0.8,
    },
    {
      title: "Village rapid-response teams",
      action:
        "Equip and train volunteer crews in the settlements furthest from a professional station, with a defined call-out protocol.",
      rationale:
        "Remote ignitions burn unchallenged until a brigade arrives. Local crews close the gap between detection and first water.",
      impact: "Indicative: shortens first-response time in remote areas; scale depends on volunteer uptake",
      horizon: "6–12 months",
      owner: "Emergency situations department + village akims",
      weight: (s) => norm(s.climateRisk) * 0.6,
    },
  ],

  oilgas: [
    {
      title: "Associated-gas capture instead of flaring",
      action:
        "Set a field-level flaring cap with a compliance deadline, and require capture, reinjection or tie-in for the volume above it.",
      rationale:
        "Routine flaring is the single largest avoidable emission source on a producing field, and the captured gas has value.",
      impact: "Indicative 40–70% reduction in routine flare volume where capture is installed",
      horizon: "2–4 years",
      owner: "Ministry of Energy + field operator",
      weight: (s) => norm(s.industrialEmissions),
    },
    {
      title: "H₂S monitoring ring around the field",
      action:
        "Install a fixed hydrogen-sulphide monitoring ring between the field and the nearest settlements, with public alerting above threshold.",
      rationale:
        "Sour-gas exposure is episodic and wind-driven; a ring with alerting protects residents during the episodes that matter.",
      impact: "No emission reduction on its own — converts an unmeasured hazard into a warned one",
      horizon: "9–18 months",
      owner: "Operator + oblast emergency department",
      weight: (s) => norm(s.pollutionIndex) * 0.9,
    },
    {
      title: "Produced-water handling audit",
      action:
        "Audit produced-water volumes, storage integrity and reinjection practice across the field's facilities.",
      rationale:
        "Produced water is the largest waste stream by volume on an oil field and the likeliest route to groundwater and soil contamination.",
      impact: "Indicative: surfaces containment gaps before they become remediation liabilities",
      horizon: "12 months",
      owner: "Environmental inspectorate + operator",
      weight: (s) => (1 - norm(s.waterQuality)) * 0.8,
    },
  ],

  radiation: [
    {
      title: "Residual contamination survey grid",
      action:
        "Complete a gridded gamma and soil-sampling survey across the accessible perimeter, and publish the resulting map.",
      rationale:
        "Legacy contamination is patchy. Without a current map, both restriction and reassurance are guesswork.",
      impact: "Indicative: establishes the boundary the other two measures depend on",
      horizon: "1–2 field seasons",
      owner: "National nuclear centre + oblast administration",
      weight: () => 0.95,
    },
    {
      title: "Land-use restriction mapping and signage",
      action:
        "Translate the survey into enforceable land-use restrictions, marked on the ground where grazing and access actually occur.",
      rationale:
        "Restrictions that exist only in a register are routinely crossed by herders and scrap collectors who were never told.",
      impact: "Indicative reduction in inadvertent exposure; depends on enforcement",
      horizon: "12–24 months after survey",
      owner: "Oblast administration + land committee",
      weight: () => 0.8,
    },
    {
      title: "Health screening for adjacent settlements",
      action:
        "Offer a standing screening programme to settlements inside the affected radius, with results held in a long-term cohort registry.",
      rationale:
        "Exposure here is historic; the actionable question is health surveillance, not prevention.",
      impact: "No exposure reduction — earlier detection and a defensible evidence base",
      horizon: "Ongoing",
      owner: "Ministry of Health",
      weight: () => 0.65,
    },
  ],
};

/** Plain-language label for each stressor. */
export const STRESSOR_LABEL: Record<HotspotType, string> = {
  industrial: "Industrial emission load",
  desertification: "Desertification and dust",
  water: "Water quality and contamination",
  wildfire: "Steppe wildfire exposure",
  oilgas: "Oil and gas operations",
  radiation: "Legacy radiological contamination",
};

/* ── Stressor selection ───────────────────────────────────────
   Prefer a real hotspot near the city — those are named, curated
   places. Fall back to the city's own readings when no hotspot is
   close enough, so every city still gets a defensible brief. */

/** Rough great-circle distance in km; good enough for proximity ranking. */
function distanceKm(aLat: number, aLon: number, bLat: number, bLon: number) {
  const R = 6371;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLon = ((bLon - aLon) * Math.PI) / 180;
  const la1 = (aLat * Math.PI) / 180;
  const la2 = (bLat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

const NEAR_KM = 250;

export interface Brief {
  station: Station;
  /** The named hotspot driving this brief, when one is close enough. */
  hotspot: Hotspot | null;
  stressor: HotspotType;
  stressorLabel: string;
  /** Why this stressor was selected — shown to the reader, not hidden. */
  basis: string;
  severity: number;
  status: Hotspot["status"];
  interventions: Intervention[];
}

/** Derive a stressor from the city's own readings when no hotspot is near. */
function stressorFromMetrics(s: Station): { type: HotspotType; basis: string } {
  const industrial = norm(s.industrialEmissions);
  const water = 1 - norm(s.waterQuality);
  const climate = norm(s.climateRisk);
  const worst = Math.max(industrial, water, climate);
  if (worst === industrial)
    return {
      type: "industrial",
      basis: `No named hotspot within ${NEAR_KM} km — selected on this city's own industrial-load index (${s.industrialEmissions}/100), its highest stressor.`,
    };
  if (worst === water)
    return {
      type: "water",
      basis: `No named hotspot within ${NEAR_KM} km — selected on this city's own Water Quality Index (${s.waterQuality}/100), its highest stressor.`,
    };
  return {
    type: "desertification",
    basis: `No named hotspot within ${NEAR_KM} km — selected on this city's own environmental-risk index (${s.climateRisk}/100), its highest stressor.`,
  };
}

/**
 * Briefs are keyed on cities, but the hotspot registry lists places —
 * this maps a hotspot to the city that would actually act on it, so the
 * dashboard table can link straight through.
 */
export function nearestCityForHotspot(h: Hotspot): Station {
  return getStations()
    .map((s) => ({ s, km: distanceKm(s.lat, s.lon, h.lat, h.lon) }))
    .sort((a, b) => a.km - b.km)[0].s;
}

/**
 * Build the brief for a city id. Pure and deterministic: the same id
 * always yields the same brief, so it can be prerendered and cited.
 */
export function buildBrief(id: string): Brief | null {
  const station = getStations().find((s) => s.id === id);
  if (!station) return null;

  // Nearest hotspot, preferring severe ones when two are similarly close.
  const ranked = HOTSPOTS.map((h) => ({
    h,
    km: distanceKm(station.lat, station.lon, h.lat, h.lon),
  }))
    .filter((x) => x.km <= NEAR_KM)
    .sort((a, b) => a.km / (a.h.severity / 100) - b.km / (b.h.severity / 100));

  const near = ranked[0] ?? null;

  const { type, basis, hotspot, severity, status } = near
    ? {
        type: near.h.type,
        hotspot: near.h,
        severity: near.h.severity,
        status: near.h.status,
        basis: `Driven by ${near.h.name}, ${Math.round(near.km)} km away — ${near.h.detail.toLowerCase()}.`,
      }
    : {
        ...stressorFromMetrics(station),
        hotspot: null as Hotspot | null,
        severity: Math.round(
          Math.max(station.industrialEmissions, 100 - station.waterQuality, station.climateRisk),
        ),
        status: "monitored" as Hotspot["status"],
      };

  // Rank the table for this specific city, then take the top three.
  const interventions = [...INTERVENTIONS[type]]
    .map((i) => ({ i, w: i.weight(station) }))
    .sort((a, b) => b.w - a.w)
    .slice(0, 3)
    .map((x) => x.i);

  return {
    station,
    hotspot,
    stressor: type,
    stressorLabel: STRESSOR_LABEL[type],
    basis,
    severity,
    status,
    interventions,
  };
}
