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

export function localeFromPathname(pathname: string): Locale {
  if (/^\/ru(\/|$)/.test(pathname)) return "ru";
  if (/^\/kk(\/|$)/.test(pathname)) return "kk";
  return "en";
}

/** Path roots that exist in every locale tree (EN root + /ru + /kk). */
const LOCALIZED_ROOTS = [
  /^\/$/,
  /^\/city\//,
  /^\/methodology(\/|$)/,
  /^\/data-sources(\/|$)/,
  /^\/sensor-network(\/|$)/,
  /^\/mission(\/|$)/,
  /^\/press(\/|$)/,
  /^\/contact(\/|$)/,
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
  meta: {
    homeTitle: string;
    homeDescription: string;
    cityTitle: (city: string) => string;
    cityDescription: (city: string, region: string) => string;
  };
}

const en: Dict = {
  nav: {
    atlas: "Atlas",
    intelligence: "Intelligence",
    assistant: "Assistant",
    community: "Community",
    live: "Live",
    menuNetwork: "Planetary network · Live",
  },
  hero: {
    badgeLive: "Kazakhstan network · live readings",
    badgeBaseline: "Kazakhstan network · model baseline",
    h1a: "The operating",
    h1b: "system for",
    h1Accent: "Kazakhstan.",
    lede: "Aetheris fuses satellites, ground stations, and AI into a single living picture of Kazakhstan — air, water, industry, and ecology, across every region in real time.",
    ctaAtlas: "Open the Atlas",
    ctaIntel: "View intelligence",
    statCities: (c, r) => `${c} cities · ${r} regions`,
    statLayers: "5 environmental layers",
    statReadings: (n) => `${n} live readings / day`,
    chipAqi: "Mean AQI · Network",
    chipAnomaly: "Temp anomaly",
    chipHotspots: "Environmental hotspots",
    descend: "Descend",
  },
  ticker: {
    networkMean: "NETWORK MEAN AQI",
    critical: "CRITICAL",
  },
  pillars: {
    tag: "System architecture",
    titleA: "One signal chain, ",
    titleAccent: "nation-wide.",
    lede: "Most environmental tools show you a slice. Aetheris closes the loop — from raw photons hitting a sensor to a decision made on the ground in Kazakhstan.",
    items: [
      {
        title: "Sense",
        body: "A national nervous system. Satellite-fed CAMS air-quality fields, Open-Meteo weather, and community reports stream {readings} fresh readings a day — every region, hourly — into one coherent model.",
      },
      {
        title: "Reason",
        body: "Environmental AI that doesn't just chart the data — it explains it. Risk forecasting, anomaly detection, and causal analysis across every layer.",
      },
      {
        title: "Act",
        body: "From insight to intervention. Ranked sustainability actions, modeled impact, and a community that verifies change on the ground.",
      },
    ],
  },
  stats: {
    readings: "Live readings / day",
    cities: "Cities monitored",
    regions: "Regions covered",
    hotspots: "Hotspots under watch",
  },
  atlas: {
    tag: "The Kazakhstan Atlas",
    title1: "Five layers.",
    title2: "One living map.",
    lede: "Air, industry, water, life, and risk — rendered as continuous fields across Kazakhstan, not a spreadsheet of disconnected readings.",
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
    lede: "The Aetheris analyst reads every layer of the live Kazakhstan model — and answers in plain language, with citations back to the sensors.",
    cta: "Start a conversation",
    analyst: "Environmental analyst",
    reasoning: "Reasoning",
    demoUser: "Risk outlook for Almaty?",
    demoAi:
      "Composite environmental risk for Almaty sits at 57/100 — driven by winter inversions that trap traffic and heating emissions in the mountain basin. PM2.5 episodes are projected to intensify through the cold season…",
  },
  community: {
    tag: "Ground truth network",
    titleA: "Satellites see the planet.",
    titleB: "People verify it.",
    lede: "Every Aetheris layer is sharpened by citizen scientists — photographing waterways, logging species, flagging pollution events. Reports are cross-checked against sensor data and rewarded.",
    cta: "Join the network",
    statLabels: [
      "Verified field reports",
      "Active missions",
      "Contribution points awarded this week",
    ],
  },
  finalCta: {
    tag: "Begin",
    titleA: "Kazakhstan is already",
    titleAccent: "talking. Listen in.",
    lede: "Open the Atlas and watch Kazakhstan's vital signs update in real time — no account required.",
    ctaAtlas: "Open the Atlas",
    ctaAssistant: "Ask the analyst",
  },
  footer: {
    tagline:
      "Kazakhstan's environmental intelligence, in one living system. Built for scientists, cities, and citizens.",
    stations: (n) => `${n} city stations reporting`,
    colPlatform: "Platform",
    colScience: "Science",
    colCompany: "Company",
    atlas: "Global Atlas",
    intelligence: "Intelligence",
    assistant: "AI Assistant",
    community: "Community",
    methodology: "Methodology",
    dataSources: "Data sources",
    sensorNetwork: "Sensor network",
    mission: "Mission",
    press: "Press kit",
    contact: "Contact",
    bottomLeft: "© 2026 Aetheris Systems · Kazakhstan environmental intelligence",
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
    allCities: "All monitored cities →",
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
  meta: {
    homeTitle: "AETHERIS — Kazakhstan Environmental Intelligence",
    homeDescription:
      "National environmental intelligence for Kazakhstan — real-time air quality, water, industrial emissions and ecological risk across every region and major city, in one living model.",
    cityTitle: (city) => `${city} air quality`,
    cityDescription: (city, region) =>
      `Live air quality in ${city}, ${region} — AQI, PM2.5, NO₂ and health guidance, plus modeled water, biodiversity and industrial-load indices.`,
  },
};

const ru: Dict = {
  nav: {
    atlas: "Атлас",
    intelligence: "Аналитика",
    assistant: "Ассистент",
    community: "Сообщество",
    live: "Live",
    menuNetwork: "Национальная сеть · Live",
  },
  hero: {
    badgeLive: "Сеть Казахстана · живые данные",
    badgeBaseline: "Сеть Казахстана · модельная база",
    h1a: "Операционная",
    h1b: "система для",
    h1Accent: "Казахстана.",
    lede: "Aetheris соединяет спутники, наземные станции и ИИ в единую живую картину Казахстана — воздух, вода, промышленность и экология по всем регионам в реальном времени.",
    ctaAtlas: "Открыть Атлас",
    ctaIntel: "Смотреть аналитику",
    statCities: (c, r) => `${c} городов · ${r} регионов`,
    statLayers: "5 экологических слоёв",
    statReadings: (n) => `${n} живых замера в сутки`,
    chipAqi: "Средний AQI · Сеть",
    chipAnomaly: "Аномалия температуры",
    chipHotspots: "Экологические горячие точки",
    descend: "Вниз",
  },
  ticker: {
    networkMean: "СРЕДНИЙ AQI СЕТИ",
    critical: "КРИТИЧНО",
  },
  pillars: {
    tag: "Архитектура системы",
    titleA: "Одна сигнальная цепь — ",
    titleAccent: "вся страна.",
    lede: "Большинство экологических сервисов показывают лишь срез. Aetheris замыкает цикл — от фотона, попавшего в сенсор, до решения, принятого на земле в Казахстане.",
    items: [
      {
        title: "Чувствовать",
        body: "Национальная нервная система. Спутниковые поля CAMS, погода Open-Meteo и отчёты сообщества дают {readings} свежих замера в сутки — каждый регион, каждый час — в единой модели.",
      },
      {
        title: "Понимать",
        body: "Экологический ИИ, который не просто рисует графики, а объясняет их: прогноз рисков, поиск аномалий и причинный анализ по каждому слою.",
      },
      {
        title: "Действовать",
        body: "От инсайта к действию: ранжированные меры устойчивости, смоделированный эффект и сообщество, которое подтверждает изменения на месте.",
      },
    ],
  },
  stats: {
    readings: "Живых замеров / сутки",
    cities: "Городов под наблюдением",
    regions: "Регионов покрыто",
    hotspots: "Горячих точек на контроле",
  },
  atlas: {
    tag: "Атлас Казахстана",
    title1: "Пять слоёв.",
    title2: "Одна живая карта.",
    lede: "Воздух, промышленность, вода, жизнь и риск — непрерывные поля по всему Казахстану вместо таблицы разрозненных показаний.",
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
    lede: "Аналитик Aetheris читает каждый слой живой модели Казахстана и отвечает простым языком — со ссылками на сенсоры.",
    cta: "Начать диалог",
    analyst: "Экологический аналитик",
    reasoning: "Анализ",
    demoUser: "Прогноз рисков для Алматы?",
    demoAi:
      "Совокупный экологический риск Алматы — 57/100: зимние инверсии запирают выбросы транспорта и отопления в горной котловине. Эпизоды PM2.5 будут усиливаться в холодный сезон…",
  },
  community: {
    tag: "Сеть наземной проверки",
    titleA: "Спутники видят планету.",
    titleB: "Люди подтверждают.",
    lede: "Каждый слой Aetheris уточняют гражданские учёные: фотографируют водоёмы, фиксируют виды, отмечают загрязнения. Отчёты сверяются с данными сенсоров и вознаграждаются.",
    cta: "Присоединиться",
    statLabels: [
      "Проверенных полевых отчётов",
      "Активных миссий",
      "Баллов вклада за эту неделю",
    ],
  },
  finalCta: {
    tag: "Начать",
    titleA: "Казахстан уже говорит.",
    titleAccent: "Прислушайтесь.",
    lede: "Откройте Атлас и наблюдайте, как обновляются жизненные показатели Казахстана в реальном времени — без регистрации.",
    ctaAtlas: "Открыть Атлас",
    ctaAssistant: "Спросить аналитика",
  },
  footer: {
    tagline:
      "Экологический интеллект Казахстана в одной живой системе. Для учёных, городов и граждан.",
    stations: (n) => `${n} городских станций на связи`,
    colPlatform: "Платформа",
    colScience: "Наука",
    colCompany: "Компания",
    atlas: "Атлас",
    intelligence: "Аналитика",
    assistant: "ИИ-ассистент",
    community: "Сообщество",
    methodology: "Методология",
    dataSources: "Источники данных",
    sensorNetwork: "Сеть станций",
    mission: "Миссия",
    press: "Пресс-кит",
    contact: "Контакты",
    bottomLeft: "© 2026 Aetheris Systems · Экологический интеллект Казахстана",
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
    allCities: "Все города под наблюдением →",
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
  meta: {
    homeTitle: "Экологический интеллект Казахстана",
    homeDescription:
      "Национальная экологическая аналитика Казахстана — качество воздуха в реальном времени, вода, промышленные выбросы и экологические риски по всем регионам и крупным городам в одной живой модели.",
    cityTitle: (city) => `Качество воздуха — ${city}`,
    cityDescription: (city, region) =>
      `Живое качество воздуха: ${city}, ${region} — AQI, PM2.5, NO₂ и рекомендации для здоровья, плюс модельные индексы воды, биоразнообразия и промышленной нагрузки.`,
  },
};

const kk: Dict = {
  nav: {
    atlas: "Атлас",
    intelligence: "Аналитика",
    assistant: "Ассистент",
    community: "Қауымдастық",
    live: "Live",
    menuNetwork: "Ұлттық желі · Live",
  },
  hero: {
    badgeLive: "Қазақстан желісі · тірі деректер",
    badgeBaseline: "Қазақстан желісі · модельдік база",
    h1a: "Қазақстанның",
    h1b: "операциялық",
    h1Accent: "жүйесі.",
    lede: "Aetheris жерсеріктерді, жер станцияларын және ЖИ-ді Қазақстанның біртұтас тірі бейнесіне біріктіреді — ауа, су, өнеркәсіп және экология, барлық өңірлерде нақты уақытта.",
    ctaAtlas: "Атласты ашу",
    ctaIntel: "Аналитиканы көру",
    statCities: (c, r) => `${c} қала · ${r} өңір`,
    statLayers: "5 экологиялық қабат",
    statReadings: (n) => `тәулігіне ${n} тірі өлшем`,
    chipAqi: "Орташа AQI · Желі",
    chipAnomaly: "Температура ауытқуы",
    chipHotspots: "Экологиялық ошақтар",
    descend: "Төмен",
  },
  ticker: {
    networkMean: "ЖЕЛІНІҢ ОРТАША AQI",
    critical: "КРИТИКАЛЫҚ",
  },
  pillars: {
    tag: "Жүйе архитектурасы",
    titleA: "Бір сигнал тізбегі — ",
    titleAccent: "бүкіл ел.",
    lede: "Экологиялық сервистердің көбі тек үзік көріністі көрсетеді. Aetheris циклді тұйықтайды — сенсорға түскен фотоннан Қазақстанда жерде қабылданған шешімге дейін.",
    items: [
      {
        title: "Сезу",
        body: "Ұлттық жүйке жүйесі. CAMS жерсеріктік өрістері, Open-Meteo ауа райы және қауымдастық есептері тәулігіне {readings} жаңа өлшем береді — әр өңір, әр сағат — бір модельде.",
      },
      {
        title: "Түсіну",
        body: "Деректі тек сызбайтын емес, түсіндіретін экологиялық ЖИ: тәуекел болжамы, ауытқуларды табу және әр қабат бойынша себеп-салдар талдауы.",
      },
      {
        title: "Әрекет ету",
        body: "Түсініктен іс-қимылға: сараланған тұрақтылық шаралары, модельденген әсер және өзгерісті жерде растайтын қауымдастық.",
      },
    ],
  },
  stats: {
    readings: "Тірі өлшем / тәулік",
    cities: "Бақылаудағы қалалар",
    regions: "Қамтылған өңірлер",
    hotspots: "Бақылаудағы ошақтар",
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
    lede: "Aetheris аналитигі Қазақстанның тірі моделінің әр қабатын оқиды және қарапайым тілмен, сенсорларға сілтеме жасай отырып жауап береді.",
    cta: "Диалог бастау",
    analyst: "Экологиялық аналитик",
    reasoning: "Талдау",
    demoUser: "Алматы бойынша тәуекел болжамы?",
    demoAi:
      "Алматының жиынтық экологиялық тәуекелі — 57/100: қысқы инверсиялар көлік пен жылыту шығарындыларын тау қазаншұңқырында ұстап қалады. PM2.5 эпизодтары суық маусымда күшейе түседі…",
  },
  community: {
    tag: "Жердегі растау желісі",
    titleA: "Жерсеріктер планетаны көреді.",
    titleB: "Адамдар растайды.",
    lede: "Aetheris-тің әр қабатын азаматтық ғалымдар нақтылайды: су айдындарын суретке түсіреді, түрлерді тіркейді, ластануды белгілейді. Есептер сенсор деректерімен салыстырылып, марапатталады.",
    cta: "Желіге қосылу",
    statLabels: [
      "Расталған далалық есептер",
      "Белсенді миссиялар",
      "Осы аптадағы үлес ұпайлары",
    ],
  },
  finalCta: {
    tag: "Бастау",
    titleA: "Қазақстан сөйлеп тұр.",
    titleAccent: "Құлақ салыңыз.",
    lede: "Атласты ашып, Қазақстанның өмірлік көрсеткіштерінің нақты уақытта жаңаруын бақылаңыз — тіркеусіз.",
    ctaAtlas: "Атласты ашу",
    ctaAssistant: "Аналитиктен сұрау",
  },
  footer: {
    tagline:
      "Қазақстанның экологиялық интеллектісі — бір тірі жүйеде. Ғалымдарға, қалаларға және азаматтарға арналған.",
    stations: (n) => `${n} қала станциясы байланыста`,
    colPlatform: "Платформа",
    colScience: "Ғылым",
    colCompany: "Компания",
    atlas: "Атлас",
    intelligence: "Аналитика",
    assistant: "ЖИ-ассистент",
    community: "Қауымдастық",
    methodology: "Әдіснама",
    dataSources: "Дерек көздері",
    sensorNetwork: "Станциялар желісі",
    mission: "Миссия",
    press: "Баспасөз жинағы",
    contact: "Байланыс",
    bottomLeft: "© 2026 Aetheris Systems · Қазақстанның экологиялық интеллектісі",
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
    allCities: "Барлық бақылаудағы қалалар →",
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
  meta: {
    homeTitle: "Қазақстанның экологиялық интеллектісі",
    homeDescription:
      "Қазақстанның ұлттық экологиялық аналитикасы — нақты уақыттағы ауа сапасы, су, өнеркәсіптік шығарындылар және экологиялық тәуекелдер, барлық өңірлер мен ірі қалалар бір тірі модельде.",
    cityTitle: (city) => `${city} — ауа сапасы`,
    cityDescription: (city, region) =>
      `${city} (${region}) бойынша тірі ауа сапасы — AQI, PM2.5, NO₂ және денсаулық ұсыныстары, қоса модельдік су, биоалуантүрлілік және өнеркәсіп индекстері.`,
  },
};

const DICTS: Record<Locale, Dict> = { en, ru, kk };

export function getDict(locale: Locale): Dict {
  return DICTS[locale];
}
