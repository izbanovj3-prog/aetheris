/* ─────────────────────────────────────────────────────────────
   AETHERIS · i18n
   Additive locale trees under static export: EN stays at the root
   (already indexed), RU/KK live under /ru and /kk. Locale is derived
   from the pathname (no prop threading, no middleware — none exists
   under `output: "export"`). Localized surfaces this pass: chrome
   (nav/footer), landing page, city pages. Map / dashboard / assistant
   remain EN.
   ───────────────────────────────────────────────────────────── */

import type { LayerKey } from "./data";

export type Locale = "en" | "ru" | "kk";
export const LOCALES: Locale[] = ["en", "ru", "kk"];
export const DEFAULT_LOCALE: Locale = "en";

/** URL prefix for a locale ("" for the default EN tree). */
export function localePrefix(locale: Locale): string {
  return locale === "en" ? "" : `/${locale}`;
}

/** BCP-47 tag for number formatting (ru/kk use space separators). */
export function numberLocale(locale: Locale): string {
  return { en: "en-US", ru: "ru-RU", kk: "kk-KZ" }[locale];
}

/** Integer with thousands grouping, identical on server and browser.
    toLocaleString() differs between the Node that prerenders and the
    visitor's browser (CLDR versions disagree on how kk groups 4-digit
    numbers), which caused a hydration mismatch on the Kazakh home page. */
export function formatInt(n: number, locale: Locale): string {
  const sep = locale === "en" ? "," : "\u00A0";
  return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, sep);
}

export function localeFromPathname(pathname: string): Locale {
  if (/^\/ru(\/|$)/.test(pathname)) return "ru";
  if (/^\/kk(\/|$)/.test(pathname)) return "kk";
  return "en";
}

/** Path roots that exist in every locale tree (EN root + /ru + /kk). */
const LOCALIZED_ROOTS = [
  /^\/$/,
  /^\/city\//,
  /^\/map(\/|$)/,
  /^\/dashboard(\/|$)/,
  /^\/assistant(\/|$)/,
  /^\/methodology(\/|$)/,
  /^\/data-sources(\/|$)/,
  /^\/sensor-network(\/|$)/,
  /^\/mission(\/|$)/,
  /^\/press(\/|$)/,
  /^\/contact(\/|$)/,
  /^\/privacy(\/|$)/,
  /^\/terms(\/|$)/,
  /^\/community(\/|$)/,
];

export function isLocalized(path: string): boolean {
  return LOCALIZED_ROOTS.some((r) => r.test(path));
}

/** Prefix an internal link with the active locale, but only for paths that
 *  actually exist in that locale tree — untranslated routes (map, dashboard,
 *  assistant, community) stay at their EN root. */
export function localePath(path: string, locale: Locale): string {
  if (locale === "en" || !isLocalized(path)) return path;
  return `${localePrefix(locale)}${path}`;
}

/** Where the language switcher should send the user from `pathname`. */
export function switchPath(pathname: string, target: Locale): string {
  const base = pathname.replace(/^\/(ru|kk)(?=\/|$)/, "") || "/";
  const to = isLocalized(base) ? base : "/";
  return `${localePrefix(target)}${to}` || "/";
}

/** hreflang alternates for a path that exists in all three trees. */
export function hreflangAlternates(path: string) {
  return {
    en: path,
    ru: `/ru${path === "/" ? "/" : path}`.replace("//", "/ru/"),
    kk: `/kk${path === "/" ? "/" : path}`.replace("//", "/kk/"),
    "x-default": path,
  };
}

/* ── Proper names ─────────────────────────────────────────── */

export const CITY_NAMES: Record<string, { ru: string; kk: string }> = {
  almaty: { ru: "Алматы", kk: "Алматы" },
  astana: { ru: "Астана", kk: "Астана" },
  shymkent: { ru: "Шымкент", kk: "Шымкент" },
  karaganda: { ru: "Караганда", kk: "Қарағанды" },
  aktobe: { ru: "Актобе", kk: "Ақтөбе" },
  atyrau: { ru: "Атырау", kk: "Атырау" },
  aktau: { ru: "Актау", kk: "Ақтау" },
  pavlodar: { ru: "Павлодар", kk: "Павлодар" },
  semey: { ru: "Семей", kk: "Семей" },
  taraz: { ru: "Тараз", kk: "Тараз" },
  kokshetau: { ru: "Кокшетау", kk: "Көкшетау" },
  turkistan: { ru: "Туркестан", kk: "Түркістан" },
  oral: { ru: "Уральск", kk: "Орал" },
  kostanay: { ru: "Костанай", kk: "Қостанай" },
  petropavl: { ru: "Петропавловск", kk: "Петропавл" },
  kyzylorda: { ru: "Кызылорда", kk: "Қызылорда" },
  oskemen: { ru: "Усть-Каменогорск", kk: "Өскемен" },
  temirtau: { ru: "Темиртау", kk: "Теміртау" },
  ekibastuz: { ru: "Экибастуз", kk: "Екібастұз" },
  zhezkazgan: { ru: "Жезказган", kk: "Жезқазған" },
  balkhash: { ru: "Балхаш", kk: "Балқаш" },
  rudny: { ru: "Рудный", kk: "Рудный" },
  zhanaozen: { ru: "Жанаозен", kk: "Жаңаөзен" },
  aralsk: { ru: "Аральск", kk: "Арал" },
  kentau: { ru: "Кентау", kk: "Кентау" },
  ridder: { ru: "Риддер", kk: "Риддер" },
  satbayev: { ru: "Сатпаев", kk: "Сәтбаев" },
  stepnogorsk: { ru: "Степногорск", kk: "Степногорск" },
};

export function cityName(id: string, fallback: string, locale: Locale): string {
  if (locale === "en") return fallback;
  return CITY_NAMES[id]?.[locale] ?? fallback;
}

export const REGION_NAMES: Record<string, { ru: string; kk: string }> = {
  Almaty: { ru: "Алматы", kk: "Алматы" },
  Akmola: { ru: "Акмола", kk: "Ақмола" },
  Shymkent: { ru: "Шымкент", kk: "Шымкент" },
  Karaganda: { ru: "Караганда", kk: "Қарағанды" },
  Aktobe: { ru: "Актобе", kk: "Ақтөбе" },
  Atyrau: { ru: "Атырау", kk: "Атырау" },
  Mangystau: { ru: "Мангистау", kk: "Маңғыстау" },
  Pavlodar: { ru: "Павлодар", kk: "Павлодар" },
  Abai: { ru: "Абай", kk: "Абай" },
  Jambyl: { ru: "Жамбыл", kk: "Жамбыл" },
  Turkistan: { ru: "Туркестан", kk: "Түркістан" },
  "West Kazakhstan": { ru: "Западный Казахстан", kk: "Батыс Қазақстан" },
  Kostanay: { ru: "Костанай", kk: "Қостанай" },
  "North Kazakhstan": { ru: "Северный Казахстан", kk: "Солтүстік Қазақстан" },
  Kyzylorda: { ru: "Кызылорда", kk: "Қызылорда" },
  "East Kazakhstan": { ru: "Восточный Казахстан", kk: "Шығыс Қазақстан" },
  Ulytau: { ru: "Улытау", kk: "Ұлытау" },
};

export function regionLabel(region: string, locale: Locale): string {
  if (locale === "en") return `${region} region`;
  const name = REGION_NAMES[region]?.[locale] ?? region;
  return locale === "ru" ? `регион ${name}` : `${name} өңірі`;
}

/** Bare localized region name (no "region"/"өңірі" suffix) for tight table cells. */
export const regionShort = (region: string, locale: Locale): string =>
  locale === "en" ? region : REGION_NAMES[region]?.[locale] ?? region;

export const HOTSPOT_NAMES: Record<string, { ru: string; kk: string }> = {
  "h-aral": { ru: "Бассейн Аральского моря", kk: "Арал теңізі алабы" },
  "h-balkhash": { ru: "Озеро Балхаш", kk: "Балқаш көлі" },
  "h-tengiz": { ru: "Тенгиз / Каспийский шельф", kk: "Теңіз / Каспий қайраңы" },
  "h-karachaganak": { ru: "Карачаганак", kk: "Қарашығанақ кен орны" },
  "h-polygon": { ru: "Семипалатинский полигон", kk: "Семей полигоны" },
  "h-temirtau": { ru: "Темиртауский меткомбинат", kk: "Теміртау метзауыты" },
  "h-ekibastuz": { ru: "Экибастузский угольный комплекс", kk: "Екібастұз көмір кешені" },
  "h-oskemen": { ru: "Металлургия Усть-Каменогорска", kk: "Өскемен металлургиясы" },
  "h-almaty": { ru: "Смоговая котловина Алматы", kk: "Алматы смог қазаншұңқыры" },
  "h-betpak": { ru: "Степные пожары Бетпак-Далы", kk: "Бетпақдала дала өрттері" },
  "h-kostanay": { ru: "Степные пожары Костаная", kk: "Қостанай дала өрттері" },
  "h-balksmelt": { ru: "Балхашский медеплавильный завод", kk: "Балқаш мыс зауыты" },
  "h-syrdarya": { ru: "Засоление Сырдарьи", kk: "Сырдария тұздануы" },
  "h-mangystau": { ru: "Опустынивание Мангистау", kk: "Маңғыстау шөлейттенуі" },
};

export function hotspotName(id: string, fallback: string, locale: Locale): string {
  if (locale === "en") return fallback;
  return HOTSPOT_NAMES[id]?.[locale] ?? fallback;
}

/* ── Categorical label tables (shared by assistant, map, dashboard) ── */

export type AqiLabel = "Good" | "Moderate" | "Sensitive" | "Unhealthy" | "Hazardous";
export type ScoreLabel = "Strong" | "Stable" | "Stressed" | "Critical";

const AQI_BAND: Record<Locale, Record<AqiLabel, string>> = {
  en: { Good: "Good", Moderate: "Moderate", Sensitive: "Sensitive", Unhealthy: "Unhealthy", Hazardous: "Hazardous" },
  ru: { Good: "хорошо", Moderate: "умеренно", Sensitive: "риск для чувствительных", Unhealthy: "вредно", Hazardous: "опасно" },
  kk: { Good: "жақсы", Moderate: "орташа", Sensitive: "сезімталдарға қауіп", Unhealthy: "зиянды", Hazardous: "қауіпті" },
};
const SCORE_BAND: Record<Locale, Record<ScoreLabel, string>> = {
  en: { Strong: "Strong", Stable: "Stable", Stressed: "Stressed", Critical: "Critical" },
  ru: { Strong: "сильный", Stable: "стабильный", Stressed: "под нагрузкой", Critical: "критический" },
  kk: { Strong: "мықты", Stable: "тұрақты", Stressed: "жүктемеде", Critical: "критикалық" },
};
export const aqiBandLabel = (label: string, l: Locale) => AQI_BAND[l][label as AqiLabel] ?? label;
export const scoreBandLabel = (label: string, l: Locale) => SCORE_BAND[l][label as ScoreLabel] ?? label;

export const KIND_LABELS: Record<Locale, Record<string, string>> = {
  en: { capital: "National capital", metropolis: "Metropolis", industrial: "Industrial hub", resource: "Resource hub", regional: "Regional centre", city: "City" },
  ru: { capital: "Столица", metropolis: "Мегаполис", industrial: "Промышленный узел", resource: "Ресурсный узел", regional: "Региональный центр", city: "Город" },
  kk: { capital: "Астана", metropolis: "Мегаполис", industrial: "Өнеркәсіп торабы", resource: "Ресурс торабы", regional: "Өңірлік орталық", city: "Қала" },
};
export const kindLabel = (kind: string, l: Locale) => KIND_LABELS[l][kind] ?? KIND_LABELS[l].city;

export const HOTSPOT_TYPE_LABELS: Record<Locale, Record<string, string>> = {
  en: { industrial: "Industrial", water: "Water", radiation: "Radiation", wildfire: "Wildfire", desertification: "Desertification", oilgas: "Oil & gas" },
  ru: { industrial: "Промышленное загрязнение", water: "Вода", radiation: "Радиация", wildfire: "Пожары", desertification: "Опустынивание", oilgas: "Нефть и газ" },
  kk: { industrial: "Өнеркәсіптік ластану", water: "Су", radiation: "Радиация", wildfire: "Өрттер", desertification: "Шөлейттену", oilgas: "Мұнай-газ" },
};
export const hotspotTypeLabel = (type: string, l: Locale) => HOTSPOT_TYPE_LABELS[l][type] ?? type;

export const STATUS_LABELS: Record<Locale, Record<string, string>> = {
  en: { critical: "critical", elevated: "elevated", monitored: "monitored", recovering: "recovering" },
  ru: { critical: "критический", elevated: "повышенный", monitored: "под контролем", recovering: "восстановление" },
  kk: { critical: "критикалық", elevated: "жоғары", monitored: "бақылауда", recovering: "қалпына келу" },
};
export const statusLabel = (status: string, l: Locale) => STATUS_LABELS[l][status] ?? status;

/** trend → localized "▲ improving" style badge for the map panel. */
export const TREND_LABELS: Record<Locale, Record<string, string>> = {
  en: { improving: "▲ improving", declining: "▼ declining", stable: "● stable" },
  ru: { improving: "▲ улучшается", declining: "▼ ухудшается", stable: "● стабильно" },
  kk: { improving: "▲ жақсаруда", declining: "▼ нашарлауда", stable: "● тұрақты" },
};
export const trendLabel = (trend: string, l: Locale) => TREND_LABELS[l][trend] ?? trend;

/* ── Dictionary ───────────────────────────────────────────── */

export interface Dict {
  nav: {
    atlas: string;
    intelligence: string;
    assistant: string;
    community: string;
    live: string;
    menuNetwork: string;
  };
  hero: {
    badgeLive: string;
    badgeBaseline: string;
    h1a: string;
    h1b: string;
    h1Accent: string;
    lede: string;
    ctaAtlas: string;
    ctaIntel: string;
    statCities: (cities: number, regions: number) => string;
    statLayers: string;
    statReadings: (n: string) => string;
    chipAqi: string;
    chipAnomaly: string;
    chipHotspots: string;
    descend: string;
  };
  ticker: {
    networkMean: string;
    critical: string;
  };
  /** Provenance badge shown next to every displayed measurement. */
  sourceNote: { source: string; asOf: string; noBuild: string };
  skipLink: string;
  dataOrigin: {
    live: string;
    modeled: string;
    liveNote: string;
    modeledNote: string;
    community: string;
    communityNote: string;
  };
  pillars: {
    tag: string;
    titleA: string;
    titleAccent: string;
    lede: string;
    items: Array<{ title: string; body: string }>;
  };
  stats: {
    readings: string;
    cities: string;
    regions: string;
    hotspots: string;
  };
  atlas: {
    tag: string;
    title1: string;
    title2: string;
    lede: string;
    cta: string;
    layers: Record<LayerKey, { label: string; describe: string }>;
  };
  assistant: {
    tag: string;
    titleA: string;
    titleAccent: string;
    lede: string;
    cta: string;
    analyst: string;
    reasoning: string;
    demoUser: string;
    demoAi: string;
    // full chat page
    grounded: string;
    online: string;
    emptyTitle: string;
    emptyLede: string;
    reading: string;
    placeholder: string;
    sendAria: string;
    messageAria: string;
    disclaimer: string;
  };
  community: {
    tag: string;
    titleA: string;
    titleB: string;
    lede: string;
    cta: string;
    statLabels: [string, string, string];
  };
  finalCta: {
    tag: string;
    titleA: string;
    titleAccent: string;
    lede: string;
    ctaAtlas: string;
    ctaAssistant: string;
  };
  footer: {
    tagline: string;
    stations: (n: number) => string;
    colPlatform: string;
    colScience: string;
    colCompany: string;
    atlas: string;
    intelligence: string;
    assistant: string;
    community: string;
    methodology: string;
    dataSources: string;
    sensorNetwork: string;
    mission: string;
    press: string;
    contact: string;
    privacy: string;
    terms: string;
    citiesSource: string;
    independence: string;
    bottomLeft: string;
    bottomRight: string;
  };
  city: {
    badgeLive: string;
    badgeBaseline: string;
    aqiLabel: string;
    band: Record<"Good" | "Moderate" | "Sensitive" | "Unhealthy" | "Hazardous", string>;
    healthTitle: string;
    healthSource: string;
    modeledTitle: string;
    gbifTitle: string;
    gbifSpecies: string;
    gbifRecords: string;
    gbifWindow: string;
    gbifPending: string;
    gbifIdle: string;
    communityTitle: string;
    communityReports: string;
    communityReporters: string;
    communityByCategory: string;
    communityIdle: string;
    communityLoading: string;
    communityUnavailable: string;
    communityNone: (city: string, days: number) => string;
    communityCaveat: (days: number) => string;
    gbifUnavailable: string;
    gbifNote: (km: number, from: number, to: number) => string;
    pm25: string;
    pm10: string;
    no2: string;
    temperature: string;
    humidity: string;
    water: string;
    bio: string;
    industrial: string;
    risk: string;
    sustainability: string;
    ctaAtlas: (city: string) => string;
    ctaIntel: string;
    allCities: string;
    advice: Record<"Good" | "Moderate" | "Sensitive" | "Unhealthy" | "Hazardous", string>;
  };
  dashboard: {
    badgeLive: string;
    badgeModel: string;
    title: string;
    aqiCurveNote: string;
    anomalyTitle: string;
    vsBaseline: string;
    window90: string;
    anomalyTrend: (perDecade: string, years: number) => string;
    gaugeLabel: string;
    gaugeLede: (n: number) => string;
    meanAqi: string;
    strongest: string;
    stressed: string;
    aiInsights: string;
    aiInsightsMeta: string;
    insights: Array<{ severity: string; title: string; body: string }>;
    hotspotsTitle: string;
    th: { site: string; region: string; type: string; severity: string; status: string; action: string };
  };
  map: {
    loading: string;
    layersTitle: string;
    clickToOpen: string;
    citiesKz: (n: number) => string;
    hotspotsTracked: (n: number) => string;
    liveAir: string;
    zoomIn: string;
    zoomOut: string;
    reset: string;
    regionAria: string;
    canvasAria: string;
    closePanel: string;
    residents: (n: string) => string;
    sustainabilityScore: string;
    temperature: string;
    humidity: string;
    pollutionIdx: string;
    trend90: string;
    airMetric: (band: string) => string;
    pm25: string;
    pm10: string;
    industrial: string;
    water: string;
    bio: string;
    gbifLegend: string;
    gbifHint: string;
    gbifLoading: string;
    gbifUnavailable: string;
    gbifValue: (species: number, capped: boolean, records: number) => string;
    gbifRecordsLine: (records: number, from: number, to: number) => string;
    risk: string;
    aiRead: string;
    aiLead: (name: string, val: string) => string;
    aiAir: string;
    aiIndustrial: string;
    aiWater: string;
    aiHeat: string;
    aiNone: string;
    fullRisk: string;
    riskQuery: (name: string) => string;
    planet: string;
    health: string;
    index: string;
    planetaryPulse: string;
    pulseAqi: string;
    pulseAnomaly: string;
    pulseHotspots: string;
    feedTitle: string;
    streaming: string;
    bootLines: string[];
    bootWordmark: string;
    bootAria: string;
  };
  meta: {
    homeTitle: string;
    homeDescription: string;
    cityTitle: (city: string) => string;
    cityDescription: (city: string, region: string) => string;
    assistantTitle: string;
    assistantDescription: string;
    atlasTitle: string;
    atlasDescription: string;
    dashboardTitle: string;
    dashboardDescription: string;
    communityTitle: string;
    communityDescription: string;
  };
}

const en: Dict = {
  nav: {
    atlas: "Atlas",
    intelligence: "Intelligence",
    assistant: "Assistant",
    community: "Community",
    live: "Open data + model",
    menuNetwork: "Kazakhstan · open data + model",
  },
  hero: {
    badgeLive: "Air quality · live open data",
    badgeBaseline: "Kazakhstan · modelled baseline",
    h1a: "The operating",
    h1b: "system for",
    h1Accent: "Kazakhstan.",
    lede: "Aetheris puts Kazakhstan's environmental picture on one map: air quality from open data (Open-Meteo / CAMS) for every region, and modelled estimates — clearly marked — for water, industrial pollution, biodiversity and ecological risk.",
    ctaAtlas: "Open the Atlas",
    ctaIntel: "View intelligence",
    statCities: (c, r) => `${c} cities · ${r} regions`,
    statLayers: "5 environmental layers",
    statReadings: (n) => `${n} open-data values / day`,
    chipAqi: "Mean AQI · all cities",
    chipAnomaly: "Temp anomaly",
    chipHotspots: "Environmental hotspots",
    descend: "Descend",
  },
  ticker: {
    networkMean: "MEAN AQI · ALL CITIES",
    critical: "CRITICAL",
  },
  skipLink: "Skip to main content",
  sourceNote: { source: "Source", asOf: "as of", noBuild: "build time unavailable" },
  dataOrigin: {
    live: "Live",
    modeled: "Modeled",
    liveNote:
      "Live open data — fetched at page load from Open-Meteo: the CAMS air-quality model and the weather forecast, updated hourly at the source. Not a ground-station reading.",
    modeledNote:
      "Modelled estimate — a deterministic regional baseline, not a measurement. Indicative only. See /methodology.",
    community: "Live · community",
    communityNote:
      "Filed by people, not instruments. Real and current, but self-reported, unverified against any sensor, and shaped by who happens to be looking — a city with no reports is not a clean city, it is a city nobody reported from.",
  },
  pillars: {
    tag: "System architecture",
    titleA: "One signal chain, ",
    titleAccent: "nation-wide.",
    lede: "Most environmental tools show you a slice. Aetheris puts open air-quality data, modelled layers and residents' reports side by side — and says which is which.",
    items: [
      {
        title: "Sense",
        body: "Open data in one place. CAMS air-quality fields and Open-Meteo weather for every region, refreshed hourly at the source ({readings} values a day), next to residents' reports — each kept separate and labelled.",
      },
      {
        title: "Reason",
        body: "Environmental AI that doesn't just chart the data — it explains it. Risk forecasting, anomaly detection, and causal analysis across every layer.",
      },
      {
        title: "Act",
        body: "From insight to action: ranked measures with modelled impact, and residents who report what they see on the ground.",
      },
    ],
  },
  stats: {
    readings: "Open-data values / day",
    cities: "Cities covered",
    regions: "Regions covered",
    hotspots: "Hotspots mapped",
  },
  atlas: {
    tag: "The Kazakhstan Atlas",
    title1: "Five layers.",
    title2: "One living map.",
    lede: "Air, industrial pollution, water, biodiversity and risk — rendered as continuous fields across Kazakhstan, not a spreadsheet of disconnected readings.",
    cta: "Explore the Atlas",
    layers: {
      air: { label: "Air Quality", describe: "PM2.5 / PM10 / NO₂ composite — live Open-Meteo (CAMS) readings over a modeled baseline" },
      industrial: { label: "Industrial Load", describe: "Emission load from metallurgy, coal power and oil-and-gas zones" },
      water: { label: "Water Quality", describe: "Surface-water index — turbidity, salinity and contaminant load" },
      biodiversity: { label: "Biodiversity", describe: "Biodiversity intactness from steppe habitat and species observation" },
      risk: { label: "Environmental Risk", describe: "Composite exposure: heat, drought, desertification and legacy contamination" },
    },
  },
  assistant: {
    tag: "Environmental AI",
    titleA: "Ask the network",
    titleAccent: "anything.",
    lede: "The Aetheris analyst answers in plain language from the Kazakhstan model — a simulated baseline for air, water, industrial pollution, biodiversity and risk. Its figures are estimates, and every answer says so.",
    cta: "Start a conversation",
    analyst: "Environmental analyst",
    reasoning: "Reasoning",
    demoUser: "Risk outlook for Almaty?",
    demoAi:
      "Modelled composite risk for Almaty is 57/100 (an estimate, not a measurement) — driven by winter inversions that trap traffic and heating emissions in the mountain basin. PM2.5 episodes are projected to intensify through the cold season…",
    grounded: "Modelled baseline · 28 cities · Kazakhstan",
    online: "Online",
    emptyTitle: "Ask the network anything.",
    emptyLede:
      "I answer from Aetheris's model — a simulated baseline for air quality, water, industrial pollution, biodiversity and ecological risk. My figures are estimates, not measurements; for air quality from open data, open a city page.",
    reading: "Reading the model…",
    placeholder: "Ask about any city, risk, or metric…",
    sendAria: "Send",
    messageAria: "Message the environmental analyst",
    disclaimer:
      "Modelled values are estimates, not measurements · not a substitute for official advisories",
  },
  community: {
    tag: "Residents' reports",
    titleA: "Satellites see the planet.",
    titleB: "People report what they see.",
    lede: "Every Aetheris layer is sharpened by citizen scientists — photographing waterways, logging species, flagging pollution events. Reports are public as filed and unchecked; when independent devices describe the same thing, the report says so.",
    cta: "Join the network",
    statLabels: [
      "Field reports in the pilot feed",
      "Cities represented",
      "Community upvotes",
    ],
  },
  finalCta: {
    tag: "Begin",
    titleA: "Kazakhstan is already",
    titleAccent: "talking. Listen in.",
    lede: "Open the Atlas: live air quality from open data, modelled layers marked as such — no account required.",
    ctaAtlas: "Open the Atlas",
    ctaAssistant: "Ask the analyst",
  },
  footer: {
    tagline:
      "Kazakhstan's environmental intelligence, in one living system. Built for scientists, cities, and citizens.",
    stations: (n) => `${n} cities covered`,
    colPlatform: "Platform",
    colScience: "Science",
    colCompany: "Company",
    atlas: "Global Atlas",
    intelligence: "Intelligence",
    assistant: "AI Assistant",
    community: "Community",
    methodology: "Methodology",
    dataSources: "Data sources",
    sensorNetwork: "Coverage",
    mission: "Mission",
    press: "Press kit",
    contact: "Contact",
    privacy: "Privacy (draft)",
    terms: "Terms (draft)",
    citiesSource: "City list · one grid point per city, air quality from Open-Meteo (CAMS model)",
    independence:
      "Aetheris is an independent student project. It is not affiliated with, endorsed by, or operated in partnership with Kazhydromet or any government agency unless explicitly stated.",
    bottomLeft: "© 2026 Aetheris · an independent student project",
    bottomRight: "51.17°N 71.43°E · Astana uplink nominal",
  },
  city: {
    badgeLive: "Live readings",
    badgeBaseline: "Model baseline",
    aqiLabel: "Air quality index",
    band: {
      Good: "Good",
      Moderate: "Moderate",
      Sensitive: "Sensitive",
      Unhealthy: "Unhealthy",
      Hazardous: "Hazardous",
    },
    healthTitle: "Health guidance",
    healthSource: "Guidance: US EPA AirNow activity recommendations",
    modeledTitle: "Modeled indices",
    gbifTitle: "Species occurrence · GBIF",
    gbifSpecies: "Distinct species",
    gbifRecords: "Occurrence records",
    gbifWindow: "What this is",
    gbifPending: "Querying GBIF for occurrence records near this city…",
    gbifIdle: "Live species data loads in your browser — this figure is fetched from GBIF when the page is viewed, not baked into the page.",
    communityTitle: "Community-sourced signal",
    communityReports: "Reports (30 days)",
    communityReporters: "Distinct reporters",
    communityByCategory: "By category",
    communityIdle: "Community reports load in your browser.",
    communityLoading: "Reading community reports…",
    communityUnavailable: "Community datastore unreachable — this is not the same as having no reports.",
    communityNone: (city, days) =>
      `No community reports for ${city} in the last ${days} days. That is an absence of reports, not evidence that conditions are fine — nobody has filed from here yet.`,
    communityCaveat: (days) =>
      `Counts cover the last ${days} days and are self-reported by the public. They are not verified against any instrument and reflect who is looking as much as what is happening. They sit beside the modeled Water Quality baseline above; they do not feed into it.`,
    gbifUnavailable: "GBIF did not respond in time. The modeled indices above are unaffected.",
    gbifNote: (km, from, to) =>
      `Species recorded within ${km} km and published to GBIF between ${from} and ${to}. This reflects recording effort as well as the state of nature — a well-surveyed area scores higher partly because more people looked. It sits beside the modeled Biodiversity Intactness Index above; it does not replace it.`,
    pm25: "PM2.5",
    pm10: "PM10",
    no2: "NO₂",
    temperature: "Temperature",
    humidity: "Humidity",
    water: "Water quality",
    bio: "Biodiversity",
    industrial: "Industrial load",
    risk: "Climate risk",
    sustainability: "Sustainability",
    ctaAtlas: (city) => `See ${city} on the Atlas`,
    ctaIntel: "Network intelligence",
    allCities: "All cities →",
    advice: {
      Good: "Air quality is satisfactory and poses little or no risk. It's a great time to be active outside.",
      Moderate:
        "Air quality is acceptable. Unusually sensitive people should consider reducing prolonged or heavy outdoor exertion; everyone else can be active as usual.",
      Sensitive:
        "Sensitive groups — children, older adults, pregnant people, and anyone with heart or lung disease — should reduce prolonged or heavy outdoor exertion and watch for symptoms like coughing or shortness of breath.",
      Unhealthy:
        "Everyone should reduce prolonged or heavy outdoor exertion; sensitive groups should avoid it. Consider moving workouts indoors and keeping windows closed during peak hours.",
      Hazardous:
        "Health alert: avoid all outdoor exertion. Stay indoors with windows closed, run an air purifier if available, and wear a well-fitting respirator (N95/FFP2) if you must go outside.",
    },
  },
  dashboard: {
    badgeLive: "Live · Open-Meteo feed",
    badgeModel: "Modeled baseline · live feed unavailable",
    title: "State of Kazakhstan",
    aqiCurveNote: "The 90-day curve is a modelled illustration, not recorded history.",
    anomalyTitle: "Global temperature anomaly",
    vsBaseline: "vs 1991–2020",
    window90: "90-day window",
    anomalyTrend: (d, y) => `▲ +${d} °C per decade over the last ${y} modeled years`,
    gaugeLabel: "Network sustainability",
    gaugeLede: (n) =>
      `Composite of air, water, biodiversity, pollution and inverse environmental risk across ${n} cities.`,
    meanAqi: "Network mean AQI",
    strongest: "Strongest cities · sustainability",
    stressed: "Most stressed cities",
    aiInsights: "AI insights",
    aiInsightsMeta: "Analyst notes · written against the modeled baseline",
    insights: [
      {
        severity: "High",
        title: "Karaganda steel-belt particulate load",
        body: "Temirtau and the Karaganda industrial cluster are driving the highest sustained PM and SO₂ load in the network. Continuous-monitoring retrofits modeled to cut exceedance hours by a third.",
      },
      {
        severity: "Watch",
        title: "Aral dust season intensifying",
        body: "Seabed dust index up 18% over Kyzylorda as the dry season sets in. Salt-laden PM10 transport projected to reach lower Syr Darya settlements within days — issue respiratory advisories.",
      },
      {
        severity: "Positive",
        title: "Northern oblast air corridor clearing",
        body: "Kokshetau, Petropavl and Kostanay show the strongest sustained air-quality improvement as the heating season ends — the clearest positive signal nationwide.",
      },
    ],
    hotspotsTitle: "Environmental hotspots & industrial zones",
    th: { site: "Site", region: "Region", type: "Type", severity: "Severity", status: "Status", action: "Action brief" },
  },
  map: {
    loading: "Acquiring satellite feed",
    layersTitle: "Layers",
    clickToOpen: "Click to open analytics →",
    citiesKz: (n) => `${n} cities · Kazakhstan`,
    hotspotsTracked: (n) => `${n} environmental hotspots on the map`,
    liveAir: "● live air · Open-Meteo",
    zoomIn: "Zoom in",
    zoomOut: "Zoom out",
    reset: "Reset view",
    regionAria: "Interactive environmental map of Kazakhstan",
    canvasAria: "Environmental map canvas",
    closePanel: "Close panel",
    residents: (n) => `${n} residents`,
    sustainabilityScore: "Sustainability score",
    temperature: "Temperature",
    humidity: "Humidity",
    pollutionIdx: "Pollution idx",
    trend90: "90-day composite trend",
    airMetric: (band) => `Air quality — AQI (${band})`,
    pm25: "PM2.5 · µg/m³",
    pm10: "PM10 · µg/m³",
    industrial: "Industrial emission load",
    water: "Water quality index",
    bio: "Biodiversity intactness",
    gbifLegend: "Species occurrence · GBIF",
    gbifHint: "Select a city to load its live species signal",
    gbifLoading: "Querying GBIF…",
    gbifUnavailable: "GBIF unavailable",
    gbifValue: (sp, capped, rec) =>
      `${sp}${capped ? "+" : ""} species · ${rec.toLocaleString("en-US")} records`,
    gbifRecordsLine: (rec, from, to) =>
      `${rec.toLocaleString("en-US")} records within 50 km, ${from}–${to}`,
    risk: "Environmental risk exposure",
    aiRead: "AI read",
    aiLead: (name, val) => `${name} is running ${val} °C above its climate baseline. `,
    aiAir: "Air quality is the dominant stressor — winter inversions push PM2.5 well past WHO guidance.",
    aiIndustrial: "Industrial emissions dominate the signal — metallurgy and power load drive most of the score deficit.",
    aiWater: "Water-system strain leads — salinity and abstraction pressure warrant close monitoring.",
    aiHeat: "Heat, drought and desertification exposure are the leading risks for this region.",
    aiNone: "No single critical stressor — the long-term warming trend is the primary signal to watch.",
    fullRisk: "Full risk outlook",
    riskQuery: (name) => `Risk outlook for ${name}`,
    planet: "Planet",
    health: "Health",
    index: "INDEX",
    planetaryPulse: "Model overview",
    pulseAqi: "Mean AQI",
    pulseAnomaly: "Anomaly",
    pulseHotspots: "Hotspots",
    feedTitle: "Notable modelled values",
    streaming: "modelled",
    bootLines: [
      "Loading the map of Kazakhstan",
      "Fetching air quality from Open-Meteo / CAMS",
      "Computing modelled layers",
      "Placing 28 cities",
      "Placing environmental hotspots",
      "Rendering",
    ],
    bootWordmark: "AETHERIS · KAZAKHSTAN ATLAS",
    bootAria: "Loading the global environmental map",
  },
  meta: {
    homeTitle: "AETHERIS — Kazakhstan Environmental Intelligence",
    homeDescription:
      "Kazakhstan's environment on one map — air quality from open data (Open-Meteo / CAMS) plus clearly marked modelled estimates for water, industrial pollution and ecological risk, across every region.",
    cityTitle: (city) => `${city} air quality`,
    cityDescription: (city, region) =>
      `Air quality in ${city}, ${region} from open data (Open-Meteo / CAMS) — AQI, PM2.5, NO₂ and health guidance, plus modelled water, biodiversity and industrial-pollution indices.`,
    assistantTitle: "AI Assistant",
    assistantDescription:
      "Ask the Aetheris analyst about any of 28 cities in Kazakhstan — briefings, risk outlooks and metric explainers, with modelled values marked as estimates.",
    atlasTitle: "Kazakhstan Atlas",
    atlasDescription:
      "A map of Kazakhstan — air quality from open data, and modelled industrial pollution, water, biodiversity and environmental risk, across 28 cities and 17 regions.",
    dashboardTitle: "Intelligence",
    dashboardDescription:
      "Environmental analytics for Kazakhstan — mean AQI from open data, temperature anomaly, city rankings and the hotspot registry, with modelled values marked.",
    communityTitle: "Community",
    communityDescription:
      "Residents' reports from across Kazakhstan — public as filed and unchecked, with matches between independent devices shown, Eco-Points, geographic badges and local eco-events.",
  },
};

const ru: Dict = {
  nav: {
    atlas: "Атлас",
    intelligence: "Аналитика",
    assistant: "Ассистент",
    community: "Сообщество",
    live: "Открытые данные + модель",
    menuNetwork: "Казахстан · открытые данные + модель",
  },
  hero: {
    badgeLive: "Качество воздуха · открытые данные",
    badgeBaseline: "Казахстан · модельная база",
    h1a: "Операционная",
    h1b: "система для",
    h1Accent: "Казахстана.",
    lede: "Aetheris собирает экологическую ситуацию Казахстана на одной карте: качество воздуха по открытым данным (Open-Meteo / CAMS) для всех регионов и модельные оценки — с явной пометкой — для воды, промышленного загрязнения, биоразнообразия и экологического риска.",
    ctaAtlas: "Открыть Атлас",
    ctaIntel: "Смотреть аналитику",
    statCities: (c, r) => `${c} городов · ${r} регионов`,
    statLayers: "5 экологических слоёв",
    statReadings: (n) => `${n} значений открытых данных в сутки`,
    chipAqi: "Средний AQI · все города",
    chipAnomaly: "Аномалия температуры",
    chipHotspots: "Экологические горячие точки",
    descend: "Вниз",
  },
  ticker: {
    networkMean: "СРЕДНИЙ AQI · ВСЕ ГОРОДА",
    critical: "КРИТИЧНО",
  },
  skipLink: "Перейти к основному содержанию",
  sourceNote: { source: "Источник", asOf: "на", noBuild: "время сборки неизвестно" },
  dataOrigin: {
    live: "Live",
    modeled: "Модель",
    liveNote:
      "Открытые данные — загружаются при открытии страницы из Open-Meteo: модель качества воздуха CAMS и прогноз погоды, обновление ежечасно на стороне источника. Это не показания наземной станции.",
    modeledNote:
      "Модельная оценка — детерминированная региональная базовая линия, а не измерение. Только для ориентира. См. /methodology.",
    community: "Live · сообщество",
    communityNote:
      "Присылают люди, а не приборы. Реально и актуально, но это самоотчёты, не сверенные ни с одним датчиком и зависящие от того, кто смотрит: город без отчётов — не чистый город, а город, откуда никто не написал.",
  },
  pillars: {
    tag: "Архитектура системы",
    titleA: "Одна сигнальная цепь — ",
    titleAccent: "вся страна.",
    lede: "Большинство экологических сервисов показывают лишь срез. Aetheris ставит рядом открытые данные о воздухе, модельные слои и сообщения жителей — и говорит, что есть что.",
    items: [
      {
        title: "Чувствовать",
        body: "Открытые данные в одном месте. Поля качества воздуха CAMS и погода Open-Meteo по каждому региону, ежечасное обновление у источника ({readings} значений в сутки), рядом — сообщения жителей; всё помечено и не смешивается.",
      },
      {
        title: "Понимать",
        body: "Экологический ИИ, который не просто рисует графики, а объясняет их: прогноз рисков, поиск аномалий и причинный анализ по каждому слою.",
      },
      {
        title: "Действовать",
        body: "От вывода к действию: ранжированные меры со смоделированным эффектом и жители, которые сообщают о том, что видят на месте.",
      },
    ],
  },
  stats: {
    readings: "Значений открытых данных / сутки",
    cities: "Городов охвачено",
    regions: "Регионов покрыто",
    hotspots: "Горячих точек на карте",
  },
  atlas: {
    tag: "Атлас Казахстана",
    title1: "Пять слоёв.",
    title2: "Одна живая карта.",
    lede: "Воздух, промышленное загрязнение, вода, жизнь и риск — непрерывные поля по всему Казахстану вместо таблицы разрозненных показаний.",
    cta: "Исследовать Атлас",
    layers: {
      air: { label: "Качество воздуха", describe: "Композит PM2.5 / PM10 / NO₂ — живые данные Open-Meteo (CAMS) поверх модельной базы" },
      industrial: { label: "Промышленная нагрузка", describe: "Выбросы металлургии, угольной энергетики и нефтегазовых зон" },
      water: { label: "Качество воды", describe: "Индекс поверхностных вод — мутность, солёность и загрязнители" },
      biodiversity: { label: "Биоразнообразие", describe: "Сохранность биоразнообразия степных экосистем и наблюдения видов" },
      risk: { label: "Экологический риск", describe: "Совокупная экспозиция: жара, засуха, опустынивание и наследие загрязнений" },
    },
  },
  assistant: {
    tag: "Экологический ИИ",
    titleA: "Спросите сеть",
    titleAccent: "о чём угодно.",
    lede: "Аналитик Aetheris простым языком отвечает по модели Казахстана — симулированной базе для воздуха, воды, промышленного загрязнения, биоразнообразия и риска. Его цифры — оценки, и каждый ответ это прямо говорит.",
    cta: "Начать диалог",
    analyst: "Экологический аналитик",
    reasoning: "Анализ",
    demoUser: "Прогноз рисков для Алматы?",
    demoAi:
      "Модельная оценка совокупного риска для Алматы — 57/100 (оценка, не измерение): зимние инверсии запирают выбросы транспорта и отопления в горной котловине. Эпизоды PM2.5 будут усиливаться в холодный сезон…",
    grounded: "Модельная база · 28 городов · Казахстан",
    online: "Онлайн",
    emptyTitle: "Спросите сеть о чём угодно.",
    emptyLede:
      "Я отвечаю по модели Aetheris — симулированной базе для качества воздуха, воды, промышленного загрязнения, биоразнообразия и экологического риска. Мои цифры — оценки, а не измерения; качество воздуха по открытым данным — на странице города.",
    reading: "Читаю модель…",
    placeholder: "Спросите о городе, риске или показателе…",
    sendAria: "Отправить",
    messageAria: "Написать экологическому аналитику",
    disclaimer:
      "Модельные значения — оценки, а не измерения · не заменяет официальные предупреждения",
  },
  community: {
    tag: "Сообщения жителей",
    titleA: "Спутники видят планету.",
    titleB: "Люди сообщают, что видят.",
    lede: "Каждый слой Aetheris уточняют гражданские учёные: фотографируют водоёмы, фиксируют виды, отмечают загрязнения. Сообщения публикуются как есть и никем не проверяются; если независимые устройства описывают одно и то же, это видно в статусе.",
    cta: "Присоединиться",
    statLabels: [
      "Полевых отчётов в пилотной ленте",
      "Городов представлено",
      "Голосов сообщества",
    ],
  },
  finalCta: {
    tag: "Начать",
    titleA: "Казахстан уже говорит.",
    titleAccent: "Прислушайтесь.",
    lede: "Откройте Атлас: качество воздуха по открытым данным, модельные слои помечены — без регистрации.",
    ctaAtlas: "Открыть Атлас",
    ctaAssistant: "Спросить аналитика",
  },
  footer: {
    tagline:
      "Экологический интеллект Казахстана в одной живой системе. Для учёных, городов и граждан.",
    stations: (n) => `${n} городов на карте`,
    colPlatform: "Платформа",
    colScience: "Наука",
    colCompany: "Компания",
    atlas: "Атлас",
    intelligence: "Аналитика",
    assistant: "ИИ-ассистент",
    community: "Сообщество",
    methodology: "Методология",
    dataSources: "Источники данных",
    sensorNetwork: "Охват",
    mission: "Миссия",
    press: "Пресс-кит",
    contact: "Контакты",
    privacy: "Конфиденциальность (черновик)",
    terms: "Условия (черновик)",
    citiesSource: "Список городов · одна точка сетки на город, качество воздуха из Open-Meteo (модель CAMS)",
    independence:
      "Aetheris — независимый студенческий проект. Он не аффилирован с Казгидрометом или каким-либо государственным органом, не одобрен ими и не работает с ними в партнёрстве, если прямо не указано иное.",
    bottomLeft: "© 2026 Aetheris · независимый студенческий проект",
    bottomRight: "51.17°N 71.43°E · Астана, связь в норме",
  },
  city: {
    badgeLive: "Живые данные",
    badgeBaseline: "Модельная база",
    aqiLabel: "Индекс качества воздуха",
    band: {
      Good: "Хорошо",
      Moderate: "Умеренно",
      Sensitive: "Чувствительным — осторожно",
      Unhealthy: "Вредно",
      Hazardous: "Опасно",
    },
    healthTitle: "Рекомендации для здоровья",
    healthSource: "Рекомендации: US EPA AirNow",
    modeledTitle: "Модельные индексы",
    gbifTitle: "Встречаемость видов · GBIF",
    gbifSpecies: "Различных видов",
    gbifRecords: "Записей наблюдений",
    gbifWindow: "Что это такое",
    gbifPending: "Запрашиваем в GBIF записи наблюдений рядом с городом…",
    gbifIdle: "Живые данные о видах загружаются в браузере — эта цифра запрашивается в GBIF при просмотре страницы, а не вшита в неё.",
    communityTitle: "Сигнал от сообщества",
    communityReports: "Отчётов (30 дней)",
    communityReporters: "Разных авторов",
    communityByCategory: "По категориям",
    communityIdle: "Отчёты сообщества загружаются в браузере.",
    communityLoading: "Читаем отчёты сообщества…",
    communityUnavailable: "Хранилище отчётов недоступно — это не то же самое, что отсутствие отчётов.",
    communityNone: (city, days) =>
      `За последние ${days} дней по городу ${city} отчётов от сообщества нет. Это отсутствие сообщений, а не доказательство того, что всё в порядке: отсюда просто ещё никто не написал.`,
    communityCaveat: (days) =>
      `Подсчёт охватывает последние ${days} дней, данные присылают сами жители. Они не сверены ни с одним прибором и отражают в том числе то, кто именно смотрит. Показатель стоит рядом с модельным индексом качества воды выше и в него не входит.`,
    gbifUnavailable: "GBIF не ответил вовремя. На модельные индексы выше это не влияет.",
    gbifNote: (km, from, to) =>
      `Виды, зафиксированные в радиусе ${km} км и опубликованные в GBIF с ${from} по ${to} год. Показатель отражает не только состояние окружающей среды, но и интенсивность наблюдений: где больше наблюдателей, там выше цифра. Он дополняет модельный индекс сохранности биоразнообразия выше, а не заменяет его.`,
    pm25: "PM2.5",
    pm10: "PM10",
    no2: "NO₂",
    temperature: "Температура",
    humidity: "Влажность",
    water: "Качество воды",
    bio: "Биоразнообразие",
    industrial: "Промнагрузка",
    risk: "Климатический риск",
    sustainability: "Устойчивость",
    ctaAtlas: (city) => `${city} на Атласе`,
    ctaIntel: "Аналитика сети",
    allCities: "Все города →",
    advice: {
      Good: "Воздух чистый и практически не представляет риска. Отличное время для активности на улице.",
      Moderate:
        "Качество воздуха приемлемое. Особо чувствительным людям стоит сократить длительные или интенсивные нагрузки на улице; остальным — обычный режим.",
      Sensitive:
        "Чувствительным группам — детям, пожилым, беременным и людям с болезнями сердца или лёгких — стоит сократить длительные и интенсивные нагрузки на улице и следить за симптомами: кашель, одышка.",
      Unhealthy:
        "Всем стоит сократить длительные и интенсивные нагрузки на улице, чувствительным группам — избегать их. Перенесите тренировки в помещение и держите окна закрытыми в часы пик.",
      Hazardous:
        "Тревога: избегайте любых нагрузок на улице. Оставайтесь в помещении с закрытыми окнами, включите очиститель воздуха, при выходе надевайте плотно прилегающий респиратор (N95/FFP2).",
    },
  },
  dashboard: {
    badgeLive: "Live · поток Open-Meteo",
    badgeModel: "Модельная база · живой поток недоступен",
    title: "Состояние Казахстана",
    aqiCurveNote: "Кривая за 90 дней — модельная иллюстрация, а не записанная история.",
    anomalyTitle: "Глобальная температурная аномалия",
    vsBaseline: "к 1991–2020",
    window90: "окно 90 дней",
    anomalyTrend: (d, y) => `▲ +${d} °C за десятилетие по модельным данным за последние ${y} лет`,
    gaugeLabel: "Устойчивость сети",
    gaugeLede: (n) =>
      `Композит воздуха, воды, биоразнообразия, загрязнения и обратного экологического риска по ${n} городам.`,
    meanAqi: "Средний AQI сети",
    strongest: "Сильнейшие города · устойчивость",
    stressed: "Города под наибольшей нагрузкой",
    aiInsights: "Выводы ИИ",
    aiInsightsMeta: "Заметки аналитика · составлены по модельной базовой линии",
    insights: [
      {
        severity: "Высокий",
        title: "Пылевая нагрузка карагандинского стального пояса",
        body: "Темиртау и карагандинский промышленный кластер дают наибольшую устойчивую нагрузку PM и SO₂ в сети. Модернизация непрерывного мониторинга по модели сокращает часы превышений на треть.",
      },
      {
        severity: "Наблюдение",
        title: "Аральский пылевой сезон усиливается",
        body: "Индекс пыли с обнажённого дна вырос на 18% над Кызылординской областью с наступлением сухого сезона. Перенос солёной PM10 достигнет низовий Сырдарьи за считанные дни — выпустите предупреждения для органов дыхания.",
      },
      {
        severity: "Позитив",
        title: "Воздушный коридор северных областей очищается",
        body: "Кокшетау, Петропавловск и Костанай показывают сильнейшее устойчивое улучшение качества воздуха к концу отопительного сезона — самый чёткий позитивный сигнал по стране.",
      },
    ],
    hotspotsTitle: "Экологические горячие точки и промышленные зоны",
    th: { site: "Объект", region: "Регион", type: "Тип", severity: "Тяжесть", status: "Статус", action: "План действий" },
  },
  map: {
    loading: "Получение спутникового сигнала",
    layersTitle: "Слои",
    clickToOpen: "Нажмите, чтобы открыть аналитику →",
    citiesKz: (n) => `${n} городов · Казахстан`,
    hotspotsTracked: (n) => `${n} экологических горячих точек на карте`,
    liveAir: "● живой воздух · Open-Meteo",
    zoomIn: "Приблизить",
    zoomOut: "Отдалить",
    reset: "Сбросить вид",
    regionAria: "Интерактивная экологическая карта Казахстана",
    canvasAria: "Холст экологической карты",
    closePanel: "Закрыть панель",
    residents: (n) => `${n} жителей`,
    sustainabilityScore: "Оценка устойчивости",
    temperature: "Температура",
    humidity: "Влажность",
    pollutionIdx: "Индекс загр.",
    trend90: "Композитный тренд за 90 дней",
    airMetric: (band) => `Качество воздуха — AQI (${band})`,
    pm25: "PM2.5 · µg/m³",
    pm10: "PM10 · µg/m³",
    industrial: "Промышленная эмиссионная нагрузка",
    water: "Индекс качества воды",
    bio: "Сохранность биоразнообразия",
    gbifLegend: "Встречаемость видов · GBIF",
    gbifHint: "Выберите город, чтобы загрузить живой сигнал",
    gbifLoading: "Запрос к GBIF…",
    gbifUnavailable: "GBIF недоступен",
    gbifValue: (sp, capped, rec) =>
      `${sp}${capped ? "+" : ""} видов · ${rec.toLocaleString("ru-RU")} записей`,
    gbifRecordsLine: (rec, from, to) =>
      `${rec.toLocaleString("ru-RU")} записей в радиусе 50 км, ${from}–${to}`,
    risk: "Экологический риск",
    aiRead: "Прочтение ИИ",
    aiLead: (name, val) => `${name} на ${val} °C выше своей климатической базы. `,
    aiAir: "Качество воздуха — главный стресс-фактор: зимние инверсии выводят PM2.5 далеко за рекомендации ВОЗ.",
    aiIndustrial: "В сигнале доминируют промышленные выбросы — металлургия и энергетика дают большую часть дефицита оценки.",
    aiWater: "Ведёт нагрузка на водную систему — засоление и водозабор требуют пристального контроля.",
    aiHeat: "Жара, засуха и опустынивание — ведущие риски для этого региона.",
    aiNone: "Единого критического стресс-фактора нет — главный сигнал для наблюдения — долгосрочное потепление.",
    fullRisk: "Полный прогноз рисков",
    riskQuery: (name) => `Прогноз рисков для ${name}`,
    planet: "Планета",
    health: "Здоровье",
    index: "ИНДЕКС",
    planetaryPulse: "Обзор модели",
    pulseAqi: "Средний AQI",
    pulseAnomaly: "Аномалия",
    pulseHotspots: "Точки",
    feedTitle: "Заметные модельные значения",
    streaming: "модель",
    bootLines: [
      "Загрузка карты Казахстана",
      "Запрос качества воздуха из Open-Meteo / CAMS",
      "Расчёт модельных слоёв",
      "Размещение 28 городов",
      "Размещение горячих точек",
      "Отрисовка",
    ],
    bootWordmark: "AETHERIS · АТЛАС КАЗАХСТАНА",
    bootAria: "Загрузка глобальной экологической карты",
  },
  meta: {
    homeTitle: "Экологический интеллект Казахстана",
    homeDescription:
      "Экологическая ситуация Казахстана на одной карте — качество воздуха по открытым данным (Open-Meteo / CAMS) и явно помеченные модельные оценки воды, промышленного загрязнения и экологического риска по всем регионам.",
    cityTitle: (city) => `Качество воздуха — ${city}`,
    cityDescription: (city, region) =>
      `Качество воздуха: ${city}, ${region} — по открытым данным (Open-Meteo / CAMS): AQI, PM2.5, NO₂ и рекомендации для здоровья, плюс модельные индексы воды, биоразнообразия и промышленного загрязнения.`,
    assistantTitle: "ИИ-ассистент",
    assistantDescription:
      "Спросите аналитика Aetheris о любом из 28 городов Казахстана — сводки, прогнозы рисков и объяснения показателей; модельные значения помечены как оценки.",
    atlasTitle: "Атлас Казахстана",
    atlasDescription:
      "Карта Казахстана — качество воздуха по открытым данным и модельные промышленное загрязнение, вода, биоразнообразие и экологический риск по 28 городам и 17 регионам.",
    dashboardTitle: "Аналитика",
    dashboardDescription:
      "Экологическая аналитика Казахстана — средний AQI по открытым данным, температурная аномалия, рейтинги городов и реестр горячих точек; модельные значения помечены.",
    communityTitle: "Сообщество",
    communityDescription:
      "Сообщения жителей со всего Казахстана — публикуются как есть и никем не проверяются; видно, когда независимые устройства сообщают одно и то же. Eco-Points, географические значки и местные экособытия.",
  },
};

const kk: Dict = {
  nav: {
    atlas: "Атлас",
    intelligence: "Аналитика",
    assistant: "Ассистент",
    community: "Қауымдастық",
    live: "Ашық дерек + модель",
    menuNetwork: "Қазақстан · ашық деректер + модель",
  },
  hero: {
    badgeLive: "Ауа сапасы · ашық деректер",
    badgeBaseline: "Қазақстан · модельдік база",
    h1a: "Қазақстанның",
    h1b: "операциялық",
    h1Accent: "жүйесі.",
    lede: "Aetheris Қазақстанның экологиялық жағдайын бір картаға жинайды: барлық өңірлер бойынша ашық деректерден (Open-Meteo / CAMS) алынған ауа сапасы және су, өнеркәсіптік ластану, биоалуантүрлілік пен экологиялық тәуекел үшін анық белгіленген модельдік бағалаулар.",
    ctaAtlas: "Атласты ашу",
    ctaIntel: "Аналитиканы көру",
    statCities: (c, r) => `${c} қала · ${r} өңір`,
    statLayers: "5 экологиялық қабат",
    statReadings: (n) => `тәулігіне ${n} ашық дерек мәні`,
    chipAqi: "Орташа AQI · барлық қалалар",
    chipAnomaly: "Температура ауытқуы",
    chipHotspots: "Экологиялық ошақтар",
    descend: "Төмен",
  },
  ticker: {
    networkMean: "ОРТАША AQI · БАРЛЫҚ ҚАЛАЛАР",
    critical: "КРИТИКАЛЫҚ",
  },
  skipLink: "Негізгі мазмұнға өту",
  sourceNote: { source: "Дереккөз", asOf: "уақыты", noBuild: "құрастыру уақыты белгісіз" },
  dataOrigin: {
    live: "Live",
    modeled: "Модель",
    liveNote:
      "Ашық деректер — бет ашылғанда Open-Meteo-дан алынады: CAMS ауа сапасы моделі және ауа райы болжамы, дереккөзде сағат сайын жаңарады. Бұл жер үсті станциясының көрсеткіші емес.",
    modeledNote:
      "Модельдік бағалау — детерминистік аймақтық базалық сызық, өлшеу емес. Тек бағдар үшін. /methodology қараңыз.",
    community: "Live · қауымдастық",
    communityNote:
      "Аспаптар емес, адамдар жіберген. Нақты әрі өзекті, бірақ бұл өзін-өзі есептеу: ешбір сенсормен тексерілмеген және кім қарайтынына тәуелді — есебі жоқ қала таза қала емес, ол — ешкім жазбаған қала.",
  },
  pillars: {
    tag: "Жүйе архитектурасы",
    titleA: "Бір сигнал тізбегі — ",
    titleAccent: "бүкіл ел.",
    lede: "Экологиялық сервистердің көбі тек үзік көріністі көрсетеді. Aetheris ауа туралы ашық деректерді, модельдік қабаттарды және тұрғындар хабарламаларын қатар қояды — және қайсысы не екенін айтады.",
    items: [
      {
        title: "Сезу",
        body: "Ашық деректер бір жерде. Әр өңір бойынша CAMS ауа сапасы өрістері мен Open-Meteo ауа райы, дереккөзде сағат сайын жаңарады (тәулігіне {readings} мән), қасында — тұрғындар хабарламалары; бәрі белгіленген және араласпайды.",
      },
      {
        title: "Түсіну",
        body: "Деректі тек сызбайтын емес, түсіндіретін экологиялық ЖИ: тәуекел болжамы, ауытқуларды табу және әр қабат бойынша себеп-салдар талдауы.",
      },
      {
        title: "Әрекет ету",
        body: "Түсініктен іс-қимылға: модельденген әсері бар сараланған шаралар және жерде көргенін хабарлайтын тұрғындар.",
      },
    ],
  },
  stats: {
    readings: "Ашық дерек мәні / тәулік",
    cities: "Қамтылған қалалар",
    regions: "Қамтылған өңірлер",
    hotspots: "Картадағы ошақтар",
  },
  atlas: {
    tag: "Қазақстан Атласы",
    title1: "Бес қабат.",
    title2: "Бір тірі карта.",
    lede: "Ауа, өнеркәсіп, су, тіршілік және тәуекел — бытыраңқы көрсеткіштер кестесі емес, бүкіл Қазақстан бойынша үздіксіз өрістер.",
    cta: "Атласты зерттеу",
    layers: {
      air: { label: "Ауа сапасы", describe: "PM2.5 / PM10 / NO₂ композиті — модельдік базаның үстіндегі тірі Open-Meteo (CAMS) деректері" },
      industrial: { label: "Өнеркәсіп жүктемесі", describe: "Металлургия, көмір энергетикасы және мұнай-газ аймақтарының шығарындылары" },
      water: { label: "Су сапасы", describe: "Жерүсті сулары индексі — лайлылық, тұздылық және ластағыштар" },
      biodiversity: { label: "Биоалуантүрлілік", describe: "Дала экожүйелерінің биоалуантүрлілігі мен түр бақылаулары" },
      risk: { label: "Экологиялық тәуекел", describe: "Жиынтық экспозиция: ыстық, құрғақшылық, шөлейттену және мұраға қалған ластану" },
    },
  },
  assistant: {
    tag: "Экологиялық ЖИ",
    titleA: "Желіден кез келгенін",
    titleAccent: "сұраңыз.",
    lede: "Aetheris аналитигі Қазақстан моделі бойынша — ауа, су, өнеркәсіптік ластану, биоалуантүрлілік және тәуекел үшін симуляцияланған база бойынша — қарапайым тілмен жауап береді. Оның сандары — бағалаулар, және әр жауап мұны ашық айтады.",
    cta: "Диалог бастау",
    analyst: "Экологиялық аналитик",
    reasoning: "Талдау",
    demoUser: "Алматы бойынша тәуекел болжамы?",
    demoAi:
      "Алматының жиынтық тәуекелінің модельдік бағасы — 57/100 (өлшеу емес, бағалау): қысқы инверсиялар көлік пен жылыту шығарындыларын тау қазаншұңқырында ұстап қалады. PM2.5 эпизодтары суық маусымда күшейе түседі…",
    grounded: "Модельдік база · 28 қала · Қазақстан",
    online: "Онлайн",
    emptyTitle: "Желіден кез келгенін сұраңыз.",
    emptyLede:
      "Мен Aetheris моделі бойынша жауап беремін — ауа сапасы, су, өнеркәсіптік ластану, биоалуантүрлілік және экологиялық тәуекел үшін симуляцияланған база. Менің сандарым өлшеу емес, бағалау; ашық деректер бойынша ауа сапасы — қала бетінде.",
    reading: "Модельді оқып жатырмын…",
    placeholder: "Қала, тәуекел немесе көрсеткіш туралы сұраңыз…",
    sendAria: "Жіберу",
    messageAria: "Экологиялық аналитикке жазу",
    disclaimer:
      "Модельдік мәндер — өлшеу емес, бағалау · ресми ескертулерді алмастырмайды",
  },
  community: {
    tag: "Тұрғындар хабарламалары",
    titleA: "Жерсеріктер планетаны көреді.",
    titleB: "Адамдар көргенін хабарлайды.",
    lede: "Aetheris-тің әр қабатын азаматтық ғалымдар нақтылайды: су айдындарын суретке түсіреді, түрлерді тіркейді, ластануды белгілейді. Хабарламалар жіберілген күйінде жарияланады және ешкім тексермейді; тәуелсіз құрылғылар бір нәрсені сипаттаса, бұл мәртебеде көрінеді.",
    cta: "Желіге қосылу",
    statLabels: [
      "Пилоттық таспадағы далалық есептер",
      "Қалалар қамтылған",
      "Қоғамдастық дауыстары",
    ],
  },
  finalCta: {
    tag: "Бастау",
    titleA: "Қазақстан сөйлеп тұр.",
    titleAccent: "Құлақ салыңыз.",
    lede: "Атласты ашыңыз: ауа сапасы ашық деректер бойынша, модельдік қабаттар белгіленген — тіркеусіз.",
    ctaAtlas: "Атласты ашу",
    ctaAssistant: "Аналитиктен сұрау",
  },
  footer: {
    tagline:
      "Қазақстанның экологиялық интеллектісі — бір тірі жүйеде. Ғалымдарға, қалаларға және азаматтарға арналған.",
    stations: (n) => `картада ${n} қала`,
    colPlatform: "Платформа",
    colScience: "Ғылым",
    colCompany: "Компания",
    atlas: "Атлас",
    intelligence: "Аналитика",
    assistant: "ЖИ-ассистент",
    community: "Қауымдастық",
    methodology: "Әдіснама",
    dataSources: "Дерек көздері",
    sensorNetwork: "Қамту",
    mission: "Миссия",
    press: "Баспасөз жинағы",
    contact: "Байланыс",
    privacy: "Құпиялылық (жоба)",
    terms: "Шарттар (жоба)",
    citiesSource: "Қалалар тізімі · әр қалаға бір тор нүктесі, ауа сапасы Open-Meteo-дан (CAMS моделі)",
    independence:
      "Aetheris — тәуелсіз студенттік жоба. Ол Қазгидрометпен немесе кез келген мемлекеттік органмен аффилиирленбеген, олармен мақұлданбаған және серіктестікте жұмыс істемейді, егер тікелей өзгеше көрсетілмесе.",
    bottomLeft: "© 2026 Aetheris · тәуелсіз студенттік жоба",
    bottomRight: "51.17°N 71.43°E · Астана, байланыс қалыпты",
  },
  city: {
    badgeLive: "Тірі деректер",
    badgeBaseline: "Модельдік база",
    aqiLabel: "Ауа сапасының индексі",
    band: {
      Good: "Жақсы",
      Moderate: "Орташа",
      Sensitive: "Сезімталдарға сақтық",
      Unhealthy: "Зиянды",
      Hazardous: "Қауіпті",
    },
    healthTitle: "Денсаулық бойынша ұсыныстар",
    healthSource: "Ұсыныстар: US EPA AirNow",
    modeledTitle: "Модельдік индекстер",
    gbifTitle: "Түрлердің кездесуі · GBIF",
    gbifSpecies: "Түрлер саны",
    gbifRecords: "Бақылау жазбалары",
    gbifWindow: "Бұл не",
    gbifPending: "GBIF-тен қала маңындағы бақылау жазбалары сұралуда…",
    gbifIdle: "Түрлер туралы тірі деректер браузерде жүктеледі — бұл сан бет ашылғанда GBIF-тен сұралады, бетке алдын ала жазылмаған.",
    communityTitle: "Қауымдастық сигналы",
    communityReports: "Есептер (30 күн)",
    communityReporters: "Әртүрлі авторлар",
    communityByCategory: "Санаттар бойынша",
    communityIdle: "Қауымдастық есептері браузерде жүктеледі.",
    communityLoading: "Қауымдастық есептері оқылуда…",
    communityUnavailable: "Есептер қоймасы қолжетімсіз — бұл есептердің жоқтығы дегенді білдірмейді.",
    communityNone: (city, days) =>
      `Соңғы ${days} күнде ${city} бойынша қауымдастық есептері жоқ. Бұл — хабарламаның жоқтығы, жағдай жақсы дегеннің дәлелі емес: бұл жерден әлі ешкім жазбаған.`,
    communityCaveat: (days) =>
      `Есеп соңғы ${days} күнді қамтиды және оны тұрғындардың өздері жібереді. Ешбір аспаппен тексерілмеген және кім қарайтынын да көрсетеді. Көрсеткіш жоғарыдағы модельдік су сапасы индексінің қасында тұрады, оған кірмейді.`,
    gbifUnavailable: "GBIF уақытында жауап бермеді. Жоғарыдағы модельдік индекстерге бұл әсер етпейді.",
    gbifNote: (km, from, to) =>
      `${km} км радиуста тіркеліп, GBIF-те ${from}–${to} жылдары жарияланған түрлер. Бұл көрсеткіш табиғат жағдайын ғана емес, бақылау белсенділігін де көрсетеді: бақылаушы көп жерде сан жоғары. Ол жоғарыдағы модельдік биоалуантүрлілік индексін алмастырмайды, толықтырады.`,
    pm25: "PM2.5",
    pm10: "PM10",
    no2: "NO₂",
    temperature: "Температура",
    humidity: "Ылғалдылық",
    water: "Су сапасы",
    bio: "Биоалуантүрлілік",
    industrial: "Өнеркәсіп жүктемесі",
    risk: "Климаттық тәуекел",
    sustainability: "Тұрақтылық",
    ctaAtlas: (city) => `Атластағы ${city}`,
    ctaIntel: "Желі аналитикасы",
    allCities: "Барлық қалалар →",
    advice: {
      Good: "Ауа таза, қауіп жоқтың қасы. Далада белсенді болуға тамаша уақыт.",
      Moderate:
        "Ауа сапасы қолайлы. Аса сезімтал адамдарға даладағы ұзақ немесе қарқынды жүктемені азайтқан жөн; қалғандарға — әдеттегі режим.",
      Sensitive:
        "Сезімтал топтарға — балаларға, егде адамдарға, жүкті әйелдерге және жүрек не өкпе ауруы барларға — даладағы ұзақ әрі қарқынды жүктемені азайтып, белгілерді бақылаған жөн: жөтел, ентігу.",
      Unhealthy:
        "Барлығына даладағы ұзақ және қарқынды жүктемені азайтқан жөн, сезімтал топтарға — мүлдем бас тарту. Жаттығуды үй ішіне көшіріп, қарбалас сағаттарда терезені жабық ұстаңыз.",
      Hazardous:
        "Дабыл: даладағы кез келген жүктемеден аулақ болыңыз. Терезесі жабық үйде отырыңыз, ауа тазартқышты қосыңыз, шығу қажет болса тығыз жанасатын респиратор (N95/FFP2) киіңіз.",
    },
  },
  dashboard: {
    badgeLive: "Live · Open-Meteo ағыны",
    badgeModel: "Модельдік база · тірі ағын қолжетімсіз",
    title: "Қазақстан жағдайы",
    aqiCurveNote: "90 күндік қисық — жазылған тарих емес, модельдік иллюстрация.",
    anomalyTitle: "Жаһандық температура ауытқуы",
    vsBaseline: "1991–2020-ға",
    window90: "90 күндік терезе",
    anomalyTrend: (d, y) => `▲ +${d} °C онжылдыққа, соңғы ${y} жылдағы модельдік деректер бойынша`,
    gaugeLabel: "Желі тұрақтылығы",
    gaugeLede: (n) =>
      `${n} қала бойынша ауа, су, биоалуантүрлілік, ластану және кері экологиялық тәуекел композиті.`,
    meanAqi: "Желінің орташа AQI",
    strongest: "Ең мықты қалалар · тұрақтылық",
    stressed: "Ең жоғары жүктемедегі қалалар",
    aiInsights: "ЖИ тұжырымдары",
    aiInsightsMeta: "Талдаушы жазбалары · модельдік базалық сызық бойынша",
    insights: [
      {
        severity: "Жоғары",
        title: "Қарағанды болат белдеуінің шаң жүктемесі",
        body: "Теміртау мен Қарағанды өнеркәсіп кластері желідегі ең жоғары тұрақты PM және SO₂ жүктемесін береді. Үздіксіз мониторинг модернизациясы модель бойынша асып кету сағаттарын үштен бірге қысқартады.",
      },
      {
        severity: "Бақылау",
        title: "Арал шаң маусымы күшеюде",
        body: "Құрғақ маусым басталуымен Қызылорда үстіндегі түп шаңы индексі 18%-ға өсті. Тұзды PM10 тасымалы бірнеше күнде Сырдария төменгі елді мекендеріне жетеді — тыныс алу бойынша ескерту жасаңыз.",
      },
      {
        severity: "Оң",
        title: "Солтүстік облыстардың ауа дәлізі тазаруда",
        body: "Көкшетау, Петропавл және Қостанай жылу маусымы аяқталуымен ауа сапасының ең күшті тұрақты жақсаруын көрсетеді — ел бойынша ең айқын оң сигнал.",
      },
    ],
    hotspotsTitle: "Экологиялық ошақтар және өнеркәсіп аймақтары",
    th: { site: "Нысан", region: "Өңір", type: "Түрі", severity: "Ауырлық", status: "Мәртебе", action: "Іс-қимыл жоспары" },
  },
  map: {
    loading: "Спутник сигналын алу",
    layersTitle: "Қабаттар",
    clickToOpen: "Аналитиканы ашу үшін басыңыз →",
    citiesKz: (n) => `${n} қала · Қазақстан`,
    hotspotsTracked: (n) => `картада ${n} экологиялық ошақ`,
    liveAir: "● тірі ауа · Open-Meteo",
    zoomIn: "Жақындату",
    zoomOut: "Алыстату",
    reset: "Көріністі қалпына келтіру",
    regionAria: "Қазақстанның интерактивті экологиялық картасы",
    canvasAria: "Экологиялық карта кенебі",
    closePanel: "Панельді жабу",
    residents: (n) => `${n} тұрғын`,
    sustainabilityScore: "Тұрақтылық бағасы",
    temperature: "Температура",
    humidity: "Ылғалдылық",
    pollutionIdx: "Ластану инд.",
    trend90: "90 күндік композиттік тренд",
    airMetric: (band) => `Ауа сапасы — AQI (${band})`,
    pm25: "PM2.5 · µg/m³",
    pm10: "PM10 · µg/m³",
    industrial: "Өнеркәсіптік шығарынды жүктемесі",
    water: "Су сапасы индексі",
    bio: "Биоалуантүрлілік сақталуы",
    gbifLegend: "Түрлердің кездесуі · GBIF",
    gbifHint: "Тірі сигналды жүктеу үшін қаланы таңдаңыз",
    gbifLoading: "GBIF сұралуда…",
    gbifUnavailable: "GBIF қолжетімсіз",
    gbifValue: (sp, capped, rec) =>
      `${sp}${capped ? "+" : ""} түр · ${rec.toLocaleString("ru-RU")} жазба`,
    gbifRecordsLine: (rec, from, to) =>
      `50 км радиуста ${rec.toLocaleString("ru-RU")} жазба, ${from}–${to}`,
    risk: "Экологиялық тәуекел",
    aiRead: "ЖИ оқуы",
    aiLead: (name, val) => `${name} климаттық базасынан ${val} °C жоғары. `,
    aiAir: "Ауа сапасы — басым стресс-фактор: қысқы инверсиялар PM2.5-ті ДДҰ ұсынымдарынан әлдеқайда асырады.",
    aiIndustrial: "Сигналда өнеркәсіптік шығарындылар басым — металлургия мен энергетика баға тапшылығының көбін береді.",
    aiWater: "Су жүйесіне жүктеме басым — тұздану мен су алу мұқият бақылауды қажет етеді.",
    aiHeat: "Ыстық, құрғақшылық және шөлейттену — осы өңір үшін негізгі тәуекелдер.",
    aiNone: "Бір ғана критикалық стресс-фактор жоқ — бақылаудағы басты сигнал — ұзақ мерзімді жылыну.",
    fullRisk: "Толық тәуекел болжамы",
    riskQuery: (name) => `${name} бойынша тәуекел болжамы`,
    planet: "Планета",
    health: "Денсаулық",
    index: "ИНДЕКС",
    planetaryPulse: "Модель шолуы",
    pulseAqi: "Орташа AQI",
    pulseAnomaly: "Ауытқу",
    pulseHotspots: "Ошақтар",
    feedTitle: "Назар аударарлық модельдік мәндер",
    streaming: "модель",
    bootLines: [
      "Қазақстан картасын жүктеу",
      "Open-Meteo / CAMS-тан ауа сапасын сұрау",
      "Модельдік қабаттарды есептеу",
      "28 қаланы орналастыру",
      "Экологиялық ошақтарды орналастыру",
      "Бейнелеу",
    ],
    bootWordmark: "AETHERIS · ҚАЗАҚСТАН АТЛАСЫ",
    bootAria: "Жаһандық экологиялық картаны жүктеу",
  },
  meta: {
    homeTitle: "Қазақстанның экологиялық интеллектісі",
    homeDescription:
      "Қазақстанның экологиялық жағдайы бір картада — ашық деректер бойынша ауа сапасы (Open-Meteo / CAMS) және барлық өңірлер бойынша су, өнеркәсіптік ластану мен экологиялық тәуекелдің анық белгіленген модельдік бағалаулары.",
    cityTitle: (city) => `${city} — ауа сапасы`,
    cityDescription: (city, region) =>
      `${city} (${region}) бойынша ауа сапасы ашық деректерден (Open-Meteo / CAMS) — AQI, PM2.5, NO₂ және денсаулық ұсыныстары, қоса модельдік су, биоалуантүрлілік және өнеркәсіптік ластану индекстері.`,
    assistantTitle: "ЖИ-ассистент",
    assistantDescription:
      "Aetheris аналитигінен Қазақстанның 28 қаласының кез келгені туралы сұраңыз — сводкалар, тәуекел болжамдары және көрсеткіштерді түсіндіру; модельдік мәндер бағалау ретінде белгіленген.",
    atlasTitle: "Қазақстан Атласы",
    atlasDescription:
      "Қазақстан картасы — ашық деректер бойынша ауа сапасы және 28 қала мен 17 өңір бойынша модельдік өнеркәсіптік ластану, су, биоалуантүрлілік және экологиялық тәуекел.",
    dashboardTitle: "Аналитика",
    dashboardDescription:
      "Қазақстанның экологиялық аналитикасы — ашық деректер бойынша орташа AQI, температура ауытқуы, қала рейтингтері және ошақтар тізілімі; модельдік мәндер белгіленген.",
    communityTitle: "Қауымдастық",
    communityDescription:
      "Қазақстанның түкпір-түкпірінен тұрғындар хабарламалары — жіберілген күйінде жарияланады және тексерілмейді; тәуелсіз құрылғылар бір нәрсені хабарлағаны көрінеді. Eco-Points, географиялық белгілер және жергілікті экоіс-шаралар.",
  },
};

const DICTS: Record<Locale, Dict> = { en, ru, kk };

export function getDict(locale: Locale): Dict {
  return DICTS[locale];
}
