/* ─────────────────────────────────────────────────────────────
   AETHERIS · Environmental reasoning engine (on-device)
   A deterministic analyst over the Kazakhstan simulation layer.
   Trilingual: intent + entity routing understands EN/RU/KK keywords
   and localized city/region names; replies are rendered in the page
   locale. The generate() signature matches a streaming LLM call, so
   wiring in the Claude API later is a drop-in replacement.
   ───────────────────────────────────────────────────────────── */

import {
  HOTSPOTS,
  aqiBand,
  getStations,
  planetSummary,
  scoreBand,
  type Station,
} from "./data";
import {
  CITY_NAMES,
  REGION_NAMES,
  aqiBandLabel,
  cityName,
  hotspotName,
  regionLabel,
  scoreBandLabel,
  type Locale,
} from "./i18n";

export interface AssistantReply {
  text: string;
  citations: string[];
}

const stations = getStations();

/** Whole-word match, Unicode-aware so Cyrillic/Kazakh names don't fire inside
 *  other words and don't get mis-bounded by ASCII-only classes. */
function hasWord(text: string, term: string): boolean {
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(?:^|[^\\p{L}\\p{N}])${escaped}(?:[^\\p{L}\\p{N}]|$)`, "iu").test(text);
}

const lc = (v: string) => v.toLowerCase();

/** Every name a station answers to, across the three languages. */
function stationAliases(s: Station): string[] {
  const loc = CITY_NAMES[s.id];
  return [s.name, loc?.ru, loc?.kk].filter(Boolean).map((v) => lc(v as string));
}
function regionAliases(region: string): string[] {
  const loc = REGION_NAMES[region];
  return [region, loc?.ru, loc?.kk].filter(Boolean).map((v) => lc(v as string));
}

/** Resolve the city a query names — in any language. City names win over
 *  region names; a region resolves to its largest representative station. */
/* Russian and Kazakh inflect place names ("в Аральске", "Караганды",
   "Алматыда"), so an exact whole-word match missed the app's own
   suggested prompt "Прогноз рисков для Аральска". A name also matches with
   a common case ending; a name ending in а/я also matches on its stem. */
const RU_ENDINGS = "а|у|е|ом|ой|ы|и|я|ю|ем";
const KK_ENDINGS =
  "да|де|та|те|дағы|дегі|тағы|тегі|ның|нің|дың|дің|тың|тің|ға|ге|қа|ке|на|не|ны|ні|ды|ді|ты|ті|дан|ден|тан|тен|нан|нен";

function hasName(text: string, name: string): boolean {
  if (hasWord(text, name)) return true;
  const esc = (v: string) => v.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const stems = [esc(name)];
  if (/[ая]$/.test(name)) stems.push(esc(name.slice(0, -1)));
  const re = new RegExp(
    `(?:^|[^\\p{L}\\p{N}])(?:${stems.join("|")})(?:${RU_ENDINGS}|${KK_ENDINGS})(?:[^\\p{L}\\p{N}]|$)`,
    "iu",
  );
  // Very short names would match too much once endings are allowed.
  return name.length >= 4 && re.test(text);
}

function findStation(q: string): Station | undefined {
  const byName = stations.find((s) => stationAliases(s).some((a) => hasName(q, a)));
  if (byName) return byName;
  const inRegion = stations
    .filter((s) => regionAliases(s.region).some((a) => hasWord(q, a)))
    .sort((a, b) => b.population - a.population);
  return inRegion[0];
}

/* ── Localized label helpers (tables shared via lib/i18n) ─── */

const aqiLabel = (aqi: number, l: Locale) => aqiBandLabel(aqiBand(aqi).label, l);
const scoreLabel = (v: number, l: Locale) => scoreBandLabel(scoreBand(v).label, l);

/* ── Response templates, per locale ───────────────────────── */

interface AiStrings {
  trend: Record<Station["trend"], string>;
  brief: (s: Station, ctx: { name: string; region: string; aqi: string; score: string }) => string;
  briefTail: (name: string) => string;
  risk: {
    air: (s: Station) => string;
    industrial: (s: Station) => string;
    exposure: (s: Station) => string;
    water: (s: Station) => string;
    habitat: (s: Station) => string;
    none: (s: Station) => string;
  };
  riskReply: (name: string, body: string) => string;
  recs: {
    air: string;
    industrial: string;
    water: string;
    habitat: string;
    exposure: string;
    none: string;
  };
  recReply: (name: string, body: string) => string;
  terms: Record<string, string>;
  national: (ctx: { count: number; aqi: number; aqiLabel: string; sum: ReturnType<typeof planetSummary> }) => string;
  hotspotReply: (ctx: { total: number; critical: number; body: string }) => string;
  greeting: string;
  fallback: (count: number) => string;
  /** Prepended to every reply that contains figures. */
  modelNotice: string;
  cite: {
    natCities: string;
    natBaseline: string;
    cluster: (name: string) => string;
    riskModel: string;
    seasonal: string;
    interventions: string;
    methodology: string;
    methodologyShort: string;
    who: string;
    firms: string;
    industrialRegistry: string;
  };
}

const EN: AiStrings = {
  trend: {
    improving: "trending positive over the last 90 days",
    declining: "deteriorating over the last 90 days",
    stable: "holding stable over the last 90 days",
  },
  brief: (s, c) =>
    [
      `**${c.name}, ${c.region}** — modelled environmental profile:`,
      ``,
      `- **Air quality:** AQI ${s.aqi} (${c.aqi}) · PM2.5 ${s.pm25} µg/m³ · PM10 ${s.pm10} µg/m³ · NO₂ ${s.no2} ppb`,
      `- **Conditions:** ${s.temperature} °C · ${s.humidity}% relative humidity`,
      `- **Water quality index:** ${s.waterQuality}/100`,
      `- **Biodiversity intactness:** ${s.biodiversity}/100`,
      `- **Industrial emission load:** ${s.industrialEmissions}/100 · pollution index ${s.pollutionIndex}/100`,
      `- **Environmental risk exposure:** ${s.climateRisk}/100`,
      `- **Aetheris sustainability score:** ${s.sustainability}/100 (${c.score}), ${EN.trend[s.trend]}`,
      `- **Temperature anomaly:** +${s.tempAnomaly.toFixed(2)} °C vs the 1991–2020 baseline`,
    ].join("\n"),
  briefTail: (name) => `Ask me for a **risk outlook** or **recommendations** for ${name} to go deeper.`,
  risk: {
    air: (s) => `**Air quality stress.** PM2.5 of ${s.pm25} µg/m³ exceeds the WHO guideline by ~${Math.round(s.pm25 / 5)}×. Winter inversions will concentrate heating and traffic emissions further.`,
    industrial: (s) => `**Industrial emission load.** An emission index of ${s.industrialEmissions}/100 points to heavy metallurgy, coal-power or oil-and-gas activity nearby; SO₂ and particulate spikes track plant cycles.`,
    exposure: (s) => `**Environmental exposure.** Composite risk of ${s.climateRisk}/100 driven by heat, drought and — across the south and west — desertification and salt-dust transport. Treat adaptation as near-term.`,
    water: (s) => `**Water system strain.** WQI of ${s.waterQuality}/100 signals salinity or contaminant pressure; monitor abstraction and turbidity through the irrigation season.`,
    habitat: (s) => `**Habitat degradation.** Biodiversity intactness of ${s.biodiversity}/100 indicates steppe and wetland ecosystem services are weakening.`,
    none: (s) => `No critical risk drivers detected. The dominant signal is the regional warming trend of +${s.tempAnomaly.toFixed(2)} °C — within adaptive range but compounding.`,
  },
  riskReply: (name, body) =>
    `Here is the 12-month environmental risk outlook for **${name}**:\n\n${body}\n\n**Confidence:** moderate-high. The outlook is built on the modelled baseline and seasonal climatology; acute events (major fires, industrial incidents) are outside scope.`,
  recs: {
    air: "Accelerate the shift from coal heating to gas/electric and expand low-emission zones — modeled to cut winter PM2.5 18–25% within two seasons.",
    industrial: "Mandate continuous stack monitoring and capture retrofits at the dominant plant; public real-time readings cut unreported exceedances sharply.",
    water: "Deploy upstream watershed sensors and tighten irrigation abstraction; early warning shortens contamination response from days to hours.",
    habitat: "Protect and reconnect steppe and riparian corridors — habitat continuity is the highest-leverage move for intactness recovery.",
    exposure: "Stress-test infrastructure against 1-in-50-year heat and drought scenarios and pre-position cooling and water reserves.",
    none: "Maintain current trajectory; the highest-leverage move is locking in renewable procurement before regional grid demand rises.",
  },
  recReply: (name, body) =>
    `Highest-leverage sustainability actions for **${name}** (ranked by modeled impact per tenge):\n\n${body}\n\nWant me to model the projected score change for any of these?`,
  terms: {
    aqi: "**AQI (Air Quality Index)** condenses pollutant concentrations — PM2.5, PM10, NO₂, O₃, SO₂, CO — into a single 0–500 scale. Below 50 is good; above 150 means health effects for the general population. Aetheris takes the US AQI from the Open-Meteo air-quality feed (CAMS satellite-driven model), refreshed hourly for all 28 monitored cities.",
    pm25: "**PM2.5** is particulate matter under 2.5 microns — small enough to cross from lungs into the bloodstream. The WHO annual guideline is 5 µg/m³. In Kazakhstan it peaks during winter inversions over Almaty, Oskemen and the coal-heating belt, and it anchors our air pillar.",
    pm10: "**PM10** is coarse particulate under 10 microns — dust, soot and, across the Aral and Mangystau regions, wind-blown salt and soil. The WHO guideline is 15 µg/m³ annual. It often spikes far above PM2.5 during steppe dust events.",
    industrial: "**The Industrial Emission Index (IEI)** scores the local emission load from metallurgy, coal power and oil-and-gas operations on a 0–100 scale. The Temirtau steel belt, Ekibastuz power complex and Oskemen smelters dominate the national signal.",
    pollution: "**The Pollution Index** is a 0–100 composite of ambient air pollution and industrial emission load for a city — a single readout of how much human-driven contamination its residents are exposed to day to day.",
    biodiversity: "**Biodiversity Intactness (BII)** estimates how much of an area's original species community remains. We fuse steppe and wetland habitat extent, fragmentation metrics and observation records. Above 90 is near-pristine; below 30 indicates ecosystem-function loss.",
    sustainability: "**The Aetheris Sustainability Score** is a weighted composite of air, water, biodiversity, inverse environmental risk and inverse pollution. It is designed to be comparable across cities; every input is listed in the methodology, and most are modelled today.",
    anomaly: "**Temperature anomaly** is the difference between current temperature and the 1991–2020 climatological baseline. Central Asia is warming faster than the global mean — most Kazakh cities now run +1.5 to +2.5 °C, the clearest local fingerprint of climate change.",
    aral: "**The Aral Sea** collapse is the defining ecological disaster of the region — irrigation diversion shrank it to a fraction of its 1960 extent, exposing the Aralkum: a salt desert whose toxic dust storms drive respiratory illness across Kyzylorda. Aetheris does not measure dust or salinity there; the region's figures on this site are modelled estimates.",
  },
  national: (c) =>
    [
      `**National snapshot — modelled baseline across ${c.count} cities:**`,
      ``,
      `- Mean urban AQI: **${c.aqi}** (${c.aqiLabel})`,
      `- Mean surface water quality: **${c.sum.meanWater}/100**`,
      `- Mean biodiversity intactness: **${c.sum.meanBio}/100**`,
      `- Mean industrial emission load: **${c.sum.meanIndustrial}/100**`,
      `- National sustainability score: **${c.sum.meanSustainability}/100**`,
      `- Mean temperature anomaly: **+${c.sum.meanAnomaly} °C** vs 1991–2020`,
      `- Environmental hotspots tracked: **${c.sum.hotspots}** (${c.sum.criticalSites} critical)`,
      ``,
      `The strongest negative signals are the Temirtau steel belt and the Aral dust season; the strongest positive signal is air-quality improvement across the northern oblasts.`,
    ].join("\n"),
  hotspotReply: (c) =>
    `**Environmental hotspot situation:** ${c.total} sites in the registry, ${c.critical} rated critical (modelled severity).\n\n${c.body}\n\nOpen the Atlas on the Industrial Load layer to see them on the map.`,
  greeting:
    `Hello — I'm the Aetheris environmental analyst for Kazakhstan. I answer from Aetheris's model — a simulated baseline for 28 cities — so my figures are estimates, not measurements. I can:\n\n- Brief you on any of the cities (try **"How is Almaty doing?"**)\n- Produce **risk outlooks** and **sustainability recommendations**\n- Explain the science behind any metric (**"What does PM10 mean?"**)\n- Summarize the **national** picture\n\nWhere should we look first?`,
  fallback: (count) =>
    `I can analyze any of the **${count} cities on the map** across Kazakhstan — ask about a specific place ("air quality in Temirtau"), request a **risk outlook**, ask for **recommendations**, or say **"national summary"** for the country-wide view.\n\nResidents can add what they see on the Community page; those reports are shown separately and are not mixed into my figures.`,
  modelNotice:
    "> **Modelled estimates, not measurements.** Every figure below — air quality included — comes from the Aetheris simulated baseline. For air quality from open data (Open-Meteo / CAMS), open the city page.",
  cite: {
    natCities: "Live air quality for these cities: Open-Meteo (CAMS) on each city page — not used in this answer",
    natBaseline: "Aetheris modelled baseline — every figure in this answer, air quality included (simulated)",
    cluster: (name) => `${name} · Aetheris modelled baseline (simulated)`,
    riskModel: "Aetheris environmental risk model ERI-4",
    seasonal: "Copernicus seasonal forecast (simulated feed)",
    interventions: "Aetheris intervention impact library",
    methodology: "Aetheris sustainability methodology v4.2",
    methodologyShort: "Aetheris methodology v4.2",
    who: "WHO air quality guidelines (2021)",
    firms: "MODIS / FIRMS thermal anomalies (simulated feed)",
    industrialRegistry: "Aetheris hotspot registry · modelled severities",
  },
};

const RU: AiStrings = {
  trend: {
    improving: "с положительной динамикой за последние 90 дней",
    declining: "с ухудшением за последние 90 дней",
    stable: "стабильно за последние 90 дней",
  },
  brief: (s, c) =>
    [
      `**${c.name}, ${c.region}** — модельный профиль состояния окружающей среды:`,
      ``,
      `- **Качество воздуха:** AQI ${s.aqi} (${c.aqi}) · PM2.5 ${s.pm25} µg/m³ · PM10 ${s.pm10} µg/m³ · NO₂ ${s.no2} ppb`,
      `- **Условия:** ${s.temperature} °C · ${s.humidity}% относительной влажности`,
      `- **Индекс качества воды:** ${s.waterQuality}/100`,
      `- **Сохранность биоразнообразия:** ${s.biodiversity}/100`,
      `- **Промышленная эмиссионная нагрузка:** ${s.industrialEmissions}/100 · индекс загрязнения ${s.pollutionIndex}/100`,
      `- **Экологический риск:** ${s.climateRisk}/100`,
      `- **Оценка устойчивости Aetheris:** ${s.sustainability}/100 (${c.score}), ${RU.trend[s.trend]}`,
      `- **Температурная аномалия:** +${s.tempAnomaly.toFixed(2)} °C относительно базы 1991–2020`,
    ].join("\n"),
  briefTail: (name) => `Спросите **прогноз рисков** или **рекомендации** для города ${name}, чтобы копнуть глубже.`,
  risk: {
    air: (s) => `**Нагрузка на качество воздуха.** PM2.5 ${s.pm25} µg/m³ превышает норму ВОЗ примерно в ${Math.round(s.pm25 / 5)}×. Зимние инверсии ещё сильнее концентрируют выбросы отопления и транспорта.`,
    industrial: (s) => `**Промышленная эмиссионная нагрузка.** Индекс выбросов ${s.industrialEmissions}/100 указывает на тяжёлую металлургию, угольную энергетику или нефтегаз поблизости; всплески SO₂ и частиц следуют за циклами предприятий.`,
    exposure: (s) => `**Экологическая экспозиция.** Совокупный риск ${s.climateRisk}/100 обусловлен жарой, засухой и — на юге и западе — опустыниванием и переносом солевой пыли. Адаптацию стоит считать первоочередной.`,
    water: (s) => `**Нагрузка на водную систему.** WQI ${s.waterQuality}/100 сигнализирует о засолении или загрязнении; следите за водозабором и мутностью в течение поливного сезона.`,
    habitat: (s) => `**Деградация местообитаний.** Сохранность биоразнообразия ${s.biodiversity}/100 указывает на ослабление экосистемных услуг степи и водно-болотных угодий.`,
    none: (s) => `Критических факторов риска не выявлено. Доминирующий сигнал — региональное потепление +${s.tempAnomaly.toFixed(2)} °C: в пределах адаптивного диапазона, но накапливается.`,
  },
  riskReply: (name, body) =>
    `Вот 12-месячный прогноз экологического риска для города **${name}**:\n\n${body}\n\n**Уверенность:** умеренно-высокая. Прогноз построен на модельной базе и сезонной климатологии; острые события (крупные пожары, промышленные аварии) вне охвата.`,
  recs: {
    air: "Ускорить переход с угольного отопления на газ/электричество и расширить зоны низких выбросов — по модели это снижает зимний PM2.5 на 18–25% за два сезона.",
    industrial: "Обязать непрерывный мониторинг труб и модернизацию улавливания на доминирующем предприятии; публичные данные в реальном времени резко сокращают незаявленные превышения.",
    water: "Разместить сенсоры выше по водосбору и ужесточить поливной водозабор; раннее предупреждение сокращает реакцию на загрязнение с дней до часов.",
    habitat: "Защитить и восстановить связность степных и прибрежных коридоров — непрерывность местообитаний даёт наибольший эффект для восстановления биоразнообразия.",
    exposure: "Проверить инфраструктуру на стресс-сценарии жары и засухи «раз в 50 лет» и заранее подготовить резервы охлаждения и воды.",
    none: "Сохранять текущую траекторию; наибольший эффект — зафиксировать закупки ВИЭ до роста спроса на региональную сеть.",
  },
  recReply: (name, body) =>
    `Меры устойчивости с наибольшим эффектом для города **${name}** (по смоделированному эффекту на тенге):\n\n${body}\n\nСмоделировать прогноз изменения оценки для любой из них?`,
  terms: {
    aqi: "**AQI (индекс качества воздуха)** сводит концентрации загрязнителей — PM2.5, PM10, NO₂, O₃, SO₂, CO — в единую шкалу 0–500. Ниже 50 — хорошо; выше 150 — воздействие на здоровье населения. Aetheris берёт US AQI из потока Open-Meteo (спутниковая модель CAMS), обновляемого ежечасно для всех 28 городов.",
    pm25: "**PM2.5** — частицы менее 2,5 микрон, достаточно мелкие, чтобы проникать из лёгких в кровоток. Годовая норма ВОЗ — 5 µg/m³. В Казахстане пик приходится на зимние инверсии над Алматы, Өскеменом и угольно-отопительным поясом; это опорный показатель нашего слоя воздуха.",
    pm10: "**PM10** — крупные частицы менее 10 микрон: пыль, сажа и — в Аральском и Мангистауском регионах — переносимые ветром соль и грунт. Норма ВОЗ — 15 µg/m³ в год. Во время степных пылевых событий часто взлетает намного выше PM2.5.",
    industrial: "**Индекс промышленных выбросов (IEI)** оценивает локальную эмиссионную нагрузку металлургии, угольной энергетики и нефтегаза по шкале 0–100. Национальный сигнал определяют стальной пояс Темиртау, энергокомплекс Экибастуза и заводы Өскемена.",
    pollution: "**Индекс загрязнения** — композит 0–100 из атмосферного загрязнения и промышленной эмиссионной нагрузки города: единый показатель того, насколько его жители ежедневно подвержены антропогенному загрязнению.",
    biodiversity: "**Сохранность биоразнообразия (BII)** оценивает, сколько исходного видового сообщества территории сохранилось. Мы объединяем площадь степных и водно-болотных местообитаний, метрики фрагментации и записи наблюдений. Выше 90 — почти нетронуто; ниже 30 — потеря функций экосистем.",
    sustainability: "**Оценка устойчивости Aetheris** — взвешенный композит воздуха, воды, биоразнообразия, обратного экологического риска и обратного загрязнения. Она сопоставима между городами; все входные данные перечислены в методологии, и большинство из них сейчас модельные.",
    anomaly: "**Температурная аномалия** — разница между текущей температурой и климатической базой 1991–2020. Центральная Азия теплеет быстрее среднемирового; большинство казахстанских городов сейчас на +1,5…+2,5 °C — самый чёткий локальный отпечаток изменения климата.",
    aral: "**Аральское море** — определяющая экологическая катастрофа региона: отвод воды на ирригацию сократил его до доли уровня 1960 года, обнажив Аралкум — солевую пустыню, чьи токсичные пыльные бури вызывают болезни дыхания по всей Кызылординской области. Aetheris не измеряет там пыль и солёность; цифры по региону на сайте — модельные оценки.",
  },
  national: (c) =>
    [
      `**Национальный срез — модельная база по ${c.count} городам:**`,
      ``,
      `- Средний городской AQI: **${c.aqi}** (${c.aqiLabel})`,
      `- Среднее качество поверхностных вод: **${c.sum.meanWater}/100**`,
      `- Средняя сохранность биоразнообразия: **${c.sum.meanBio}/100**`,
      `- Средняя промышленная эмиссионная нагрузка: **${c.sum.meanIndustrial}/100**`,
      `- Национальная оценка устойчивости: **${c.sum.meanSustainability}/100**`,
      `- Средняя температурная аномалия: **+${c.sum.meanAnomaly} °C** к 1991–2020`,
      `- Отслеживаемых горячих точек: **${c.sum.hotspots}** (${c.sum.criticalSites} критических)`,
      ``,
      `Сильнейшие негативные сигналы — стальной пояс Темиртау и сезон аральской пыли; сильнейший позитивный — улучшение качества воздуха в северных областях.`,
    ].join("\n"),
  hotspotReply: (c) =>
    `**Ситуация по горячим точкам:** ${c.total} объектов в реестре, ${c.critical} с критической модельной оценкой.\n\n${c.body}\n\nОткройте Атлас на слое промышленной нагрузки, чтобы увидеть их на карте.`,
  greeting:
    `Здравствуйте — я экологический аналитик Aetheris по Казахстану. Я отвечаю по модели Aetheris — симулированной базе для 28 городов, — поэтому мои цифры — оценки, а не измерения. Я могу:\n\n- Дать сводку по любому из этих городов (попробуйте **«Как дела в Алматы?»**)\n- Составить **прогноз рисков** и **рекомендации по устойчивости**\n- Объяснить науку за любым показателем (**«Что значит PM10?»**)\n- Обобщить **национальную** картину\n\nС чего начнём?`,
  fallback: (count) =>
    `Я могу проанализировать любой из **${count} городов на карте** Казахстана — спросите про конкретное место («качество воздуха в Темиртау»), запросите **прогноз рисков**, попросите **рекомендации** или скажите **«национальная сводка»** для картины по стране.\n\nЖители могут сообщить о том, что видят, на странице сообщества; эти сообщения показываются отдельно и не смешиваются с моими цифрами.`,
  modelNotice:
    "> **Модельные оценки, а не измерения.** Все цифры ниже, включая качество воздуха, взяты из симулированной базы Aetheris. Качество воздуха по открытым данным (Open-Meteo / CAMS) — на странице города.",
  cite: {
    natCities: "Качество воздуха по открытым данным Open-Meteo (CAMS) — на странице каждого города; в этом ответе не используется",
    natBaseline: "Модельная база Aetheris — все цифры в этом ответе, включая качество воздуха (симуляция)",
    cluster: (name) => `${name} · модельная база Aetheris (симуляция)`,
    riskModel: "Модель экологического риска Aetheris ERI-4",
    seasonal: "Сезонный прогноз Copernicus (симуляция потока)",
    interventions: "Библиотека эффектов вмешательств Aetheris",
    methodology: "Методология устойчивости Aetheris v4.2",
    methodologyShort: "Методология Aetheris v4.2",
    who: "Рекомендации ВОЗ по качеству воздуха (2021)",
    firms: "Термоаномалии MODIS / FIRMS (симуляция потока)",
    industrialRegistry: "Реестр горячих точек Aetheris · модельные оценки",
  },
};

const KK: AiStrings = {
  trend: {
    improving: "соңғы 90 күнде оң динамикамен",
    declining: "соңғы 90 күнде нашарлаумен",
    stable: "соңғы 90 күнде тұрақты",
  },
  brief: (s, c) =>
    [
      `**${c.name}, ${c.region}** — қоршаған орта жай-күйінің модельдік профилі:`,
      ``,
      `- **Ауа сапасы:** AQI ${s.aqi} (${c.aqi}) · PM2.5 ${s.pm25} µg/m³ · PM10 ${s.pm10} µg/m³ · NO₂ ${s.no2} ppb`,
      `- **Жағдай:** ${s.temperature} °C · ${s.humidity}% салыстырмалы ылғалдылық`,
      `- **Су сапасы индексі:** ${s.waterQuality}/100`,
      `- **Биоалуантүрлілік сақталуы:** ${s.biodiversity}/100`,
      `- **Өнеркәсіптік шығарынды жүктемесі:** ${s.industrialEmissions}/100 · ластану индексі ${s.pollutionIndex}/100`,
      `- **Экологиялық тәуекел:** ${s.climateRisk}/100`,
      `- **Aetheris тұрақтылық бағасы:** ${s.sustainability}/100 (${c.score}), ${KK.trend[s.trend]}`,
      `- **Температура ауытқуы:** 1991–2020 базасына қатысты +${s.tempAnomaly.toFixed(2)} °C`,
    ].join("\n"),
  briefTail: (name) => `Тереңірек үшін ${name} бойынша **тәуекел болжамын** немесе **ұсыныстарды** сұраңыз.`,
  risk: {
    air: (s) => `**Ауа сапасына жүктеме.** PM2.5 ${s.pm25} µg/m³ ДДҰ нормасынан шамамен ${Math.round(s.pm25 / 5)}× асып тұр. Қысқы инверсиялар жылыту мен көлік шығарындыларын одан әрі шоғырландырады.`,
    industrial: (s) => `**Өнеркәсіптік шығарынды жүктемесі.** Шығарынды индексі ${s.industrialEmissions}/100 жақын маңдағы ауыр металлургияны, көмір энергетикасын немесе мұнай-газды көрсетеді; SO₂ мен бөлшек шамалары зауыт циклдеріне ілеседі.`,
    exposure: (s) => `**Экологиялық экспозиция.** Жиынтық тәуекел ${s.climateRisk}/100 — ыстық, құрғақшылық және оңтүстік пен батыста шөлейттену мен тұзды шаң тасымалынан. Бейімделуді кезек күттірмейтін деп қараңыз.`,
    water: (s) => `**Су жүйесіне жүктеме.** WQI ${s.waterQuality}/100 тұздану немесе ластану қысымын білдіреді; суару маусымында су алу мен лайлылықты бақылаңыз.`,
    habitat: (s) => `**Мекендеу орындарының нашарлауы.** Биоалуантүрлілік сақталуы ${s.biodiversity}/100 дала мен сулы-батпақты алқаптардың экожүйелік қызметтерінің әлсіреуін көрсетеді.`,
    none: (s) => `Критикалық тәуекел факторлары анықталмады. Басым сигнал — өңірлік жылыну +${s.tempAnomaly.toFixed(2)} °C: бейімделу шегінде, бірақ жинақталуда.`,
  },
  riskReply: (name, body) =>
    `**${name}** бойынша 12 айлық экологиялық тәуекел болжамы:\n\n${body}\n\n**Сенімділік:** орташа-жоғары. Болжам модельдік базаға және маусымдық климатологияға негізделген; кенет оқиғалар (ірі өрттер, өнеркәсіптік апаттар) қамту аясынан тыс.`,
  recs: {
    air: "Көмір жылытудан газ/электрге көшуді жеделдетіп, төмен шығарынды аймақтарын кеңейту — модель бойынша екі маусымда қысқы PM2.5-ті 18–25% азайтады.",
    industrial: "Басым зауытта мұржаларды үздіксіз бақылау мен ұстау модернизациясын міндеттеу; нақты уақыттағы ашық деректер жарияланбаған асып кетулерді күрт азайтады.",
    water: "Су жинау алабының жоғарғы ағысына сенсорлар орналастырып, суару су алуын қатаңдату; ерте ескерту ластануға жауапты күндерден сағаттарға қысқартады.",
    habitat: "Дала мен өзен маңы дәліздерінің байланыстылығын қорғап, қалпына келтіру — мекендеу орындарының үздіксіздігі биоалуантүрлілікті қалпына келтіруде ең тиімді қадам.",
    exposure: "Инфрақұрылымды «50 жылда бір рет» ыстық пен құрғақшылық сценарийлеріне сынап, салқындату мен су қорларын алдын ала дайындау.",
    none: "Ағымдағы бағытты сақтау; ең тиімді қадам — өңірлік желіге сұраныс өспей тұрып ЖЭК сатып алуды бекіту.",
  },
  recReply: (name, body) =>
    `**${name}** үшін ең тиімді тұрақтылық шаралары (теңгеге шаққандағы модельденген әсер бойынша):\n\n${body}\n\nОсылардың кез келгені бойынша бағаның болжамды өзгерісін модельдейін бе?`,
  terms: {
    aqi: "**AQI (ауа сапасы индексі)** ластағыш концентрацияларын — PM2.5, PM10, NO₂, O₃, SO₂, CO — бірыңғай 0–500 шкаласына жинайды. 50-ден төмен — жақсы; 150-ден жоғары — халық денсаулығына әсер. Aetheris US AQI-ды Open-Meteo ағынынан (спутниктік CAMS моделі) алады, барлық 28 қала үшін сағат сайын жаңарады.",
    pm25: "**PM2.5** — 2,5 микроннан кіші бөлшектер, өкпеден қанға өтетіндей ұсақ. ДДҰ жылдық нормасы — 5 µg/m³. Қазақстанда шыңы Алматы, Өскемен және көмір-жылу белдеуіндегі қысқы инверсияларға келеді; бұл — ауа қабатымыздың тірегі.",
    pm10: "**PM10** — 10 микроннан кіші ірі бөлшектер: шаң, күйе және Арал мен Маңғыстау өңірлерінде желмен ұшатын тұз бен топырақ. ДДҰ нормасы — жылына 15 µg/m³. Дала шаңды оқиғаларында жиі PM2.5-тен әлдеқайда жоғары көтеріледі.",
    industrial: "**Өнеркәсіптік шығарынды индексі (IEI)** металлургия, көмір энергетикасы және мұнай-газдың жергілікті шығарынды жүктемесін 0–100 шкаласымен бағалайды. Ұлттық сигналды Теміртау болат белдеуі, Екібастұз энергокешені және Өскемен зауыттары айқындайды.",
    pollution: "**Ластану индексі** — қаланың атмосфералық ластануы мен өнеркәсіптік шығарынды жүктемесінен тұратын 0–100 композиті: тұрғындардың күнделікті антропогендік ластануға ұшырау дәрежесінің бірыңғай көрсеткіші.",
    biodiversity: "**Биоалуантүрлілік сақталуы (BII)** аумақтың бастапқы түр қауымдастығының қаншасы сақталғанын бағалайды. Біз дала мен сулы-батпақты мекендеу ауқымын, фрагментация метрикаларын және бақылау жазбаларын біріктіреміз. 90-нан жоғары — таза дерлік; 30-дан төмен — экожүйе функцияларының жоғалуы.",
    sustainability: "**Aetheris тұрақтылық бағасы** — ауа, су, биоалуантүрлілік, кері экологиялық тәуекел және кері ластанудың салмақталған композиті. Ол қалалар арасында салыстырмалы; барлық кіріс деректері әдістемеде көрсетілген, олардың көбі қазір модельдік.",
    anomaly: "**Температура ауытқуы** — ағымдағы температура мен 1991–2020 климаттық база арасындағы айырма. Орталық Азия әлемдік ортадан жылдам жылынуда — қазақстандық қалалардың көбі қазір +1,5…+2,5 °C, бұл климат өзгерісінің ең айқын жергілікті ізі.",
    aral: "**Арал теңізі** — өңірдің айқындаушы экологиялық апаты: суды суаруға бұру оны 1960 жылғы деңгейдің бір бөлігіне дейін кішірейтіп, Аралқұмды ашты — оның улы шаңды дауылдары бүкіл Қызылорда бойынша тыныс алу ауруларын тудырады. Aetheris онда шаң мен тұздылықты өлшемейді; сайттағы өңір бойынша сандар — модельдік бағалаулар.",
  },
  national: (c) =>
    [
      `**Ұлттық қима — ${c.count} қала бойынша модельдік база:**`,
      ``,
      `- Орташа қалалық AQI: **${c.aqi}** (${c.aqiLabel})`,
      `- Орташа жерүсті су сапасы: **${c.sum.meanWater}/100**`,
      `- Орташа биоалуантүрлілік сақталуы: **${c.sum.meanBio}/100**`,
      `- Орташа өнеркәсіптік шығарынды жүктемесі: **${c.sum.meanIndustrial}/100**`,
      `- Ұлттық тұрақтылық бағасы: **${c.sum.meanSustainability}/100**`,
      `- Орташа температура ауытқуы: 1991–2020-ға қатысты **+${c.sum.meanAnomaly} °C**`,
      `- Қадағаланатын ошақтар: **${c.sum.hotspots}** (${c.sum.criticalSites} критикалық)`,
      ``,
      `Ең күшті теріс сигналдар — Теміртау болат белдеуі мен Арал шаң маусымы; ең күшті оң сигнал — солтүстік облыстардағы ауа сапасының жақсаруы.`,
    ].join("\n"),
  hotspotReply: (c) =>
    `**Экологиялық ошақтар жағдайы:** ${c.total} нысан тізілімде, ${c.critical} нысанның модельдік бағасы критикалық.\n\n${c.body}\n\nОларды картадан көру үшін Атласты өнеркәсіп жүктемесі қабатында ашыңыз.`,
  greeting:
    `Сәлеметсіз бе — мен Қазақстан бойынша Aetheris экологиялық аналитигімін. Мен Aetheris моделі бойынша — 28 қалаға арналған симуляцияланған база бойынша — жауап беремін, сондықтан менің сандарым өлшеу емес, бағалау. Мен:\n\n- Осы қалалардың кез келгені бойынша қысқаша сводка беремін (**«Алматы қалай?»** деп көріңіз)\n- **Тәуекел болжамдары** мен **тұрақтылық ұсыныстарын** дайындаймын\n- Кез келген көрсеткіштің ғылымын түсіндіремін (**«PM10 деген не?»**)\n- **Ұлттық** картинаны қорытындылаймын\n\nҚайдан бастаймыз?`,
  fallback: (count) =>
    `Мен Қазақстандағы картадағы **${count} қаланың** кез келгенін талдай аламын — нақты жер туралы сұраңыз («Теміртаудағы ауа сапасы»), **тәуекел болжамын** сұраңыз, **ұсыныстар** сұраңыз немесе ел бойынша көрініс үшін **«ұлттық сводка»** деңіз.\n\nТұрғындар көргенін қауымдастық бетінде хабарлай алады; ол хабарламалар бөлек көрсетіледі және менің сандарыма араластырылмайды.`,
  modelNotice:
    "> **Өлшеу емес, модельдік бағалаулар.** Төмендегі барлық сандар, ауа сапасын қоса, Aetheris симуляцияланған базасынан алынған. Ашық деректер бойынша ауа сапасы (Open-Meteo / CAMS) — қала бетінде.",
  cite: {
    natCities: "Ашық деректер бойынша ауа сапасы Open-Meteo (CAMS) — әр қаланың бетінде; бұл жауапта қолданылмайды",
    natBaseline: "Aetheris модельдік базасы — бұл жауаптағы барлық сандар, ауа сапасын қоса (симуляция)",
    cluster: (name) => `${name} · Aetheris модельдік базасы (симуляция)`,
    riskModel: "Aetheris экологиялық тәуекел моделі ERI-4",
    seasonal: "Copernicus маусымдық болжамы (симуляция ағыны)",
    interventions: "Aetheris араласу әсерлері кітапханасы",
    methodology: "Aetheris тұрақтылық әдіснамасы v4.2",
    methodologyShort: "Aetheris әдіснамасы v4.2",
    who: "ДДҰ ауа сапасы бойынша ұсынымдары (2021)",
    firms: "MODIS / FIRMS термоаномалиялары (симуляция ағыны)",
    industrialRegistry: "Aetheris ошақтар тізілімі · модельдік бағалаулар",
  },
};

const AI: Record<Locale, AiStrings> = { en: EN, ru: RU, kk: KK };

/* ── Intent keywords (union across languages) ─────────────── */

const KW = {
  national: ["national", "country", "kazakhstan", "nationwide", "network", "everywhere",
    "национальн", "страна", "казахстан", "по стране", "сеть", "ұлттық", "ел ", "қазақстан", "желі"],
  summary: ["summary", "overview", "snapshot", "сводка", "обзор", "срез", "сводку", "сводке",
    "сводка", "қорытынды", "сводка", "қима", "шолу"],
  whole: ["whole", "весь", "вся", "всё", "бүкіл", "барлық"],
  risk: ["risk", "predict", "forecast", "outlook", "threat",
    "риск", "прогноз", "угроз", "тәуекел", "болжам", "қауіп"],
  rec: ["recommend", "improve", "action", "advice", "should",
    "рекоменд", "улучш", "меры", "совет", "действ", "ұсын", "жақсарт", "шара", "кеңес"],
  definitional: ["what", "explain", "mean", "how", "define", "definition",
    "что ", "объясн", "значит", "как ", "определ", "не ", "не?", "түсіндір", "деген", "қалай", "анықта"],
  hotspot: ["hotspot", "industrial", "fire", "wildfire", "smelter", "plant", "pollution site",
    "горячие точки", "горячих точек", "промышленн", "пожар", "завод", "выброс",
    "ошақ", "өнеркәсіп", "өрт", "зауыт"],
  greeting: ["hi", "hello", "hey", "привет", "здравствуй", "здравствуйте", "сәлем", "салем", "сәлеметсіз"],
};

const anyKw = (text: string, list: string[]) => list.some((w) => text.includes(w));

/** Term match keys — EN keys plus RU/KK triggers → dictionary term id. */
const TERM_TRIGGERS: Array<{ id: keyof AiStrings["terms"]; match: string[] }> = [
  { id: "aqi", match: ["aqi", "air quality index", "индекс качества воздуха", "ауа сапасы индекс"] },
  { id: "pm25", match: ["pm2.5", "pm25", "pm 2.5", "particulate", "частиц", "бөлшек"] },
  { id: "pm10", match: ["pm10", "pm 10", "coarse", "крупн"] },
  { id: "industrial", match: ["industrial", "emission", "iei", "промышленн", "выброс", "өнеркәсіп", "шығарынды"] },
  { id: "pollution", match: ["pollution index", "индекс загрязнения", "ластану индекс"] },
  { id: "biodiversity", match: ["biodiversity", "bii", "биоразнообраз", "биоалуантүр"] },
  { id: "sustainability", match: ["sustainability score", "sustainability", "устойчивост", "тұрақтылық"] },
  { id: "anomaly", match: ["temperature anomaly", "anomaly", "аномали", "ауытқу"] },
  { id: "aral", match: ["aral", "aral sea", "арал", "арал теңіз"] },
];

/** Intent + entity router. Order matters: an explicit national ask outranks
 *  a named place, a place outranks a definition, greetings are whole-word. */
export function generate(query: string, locale: Locale = "en"): AssistantReply {
  const q = query.toLowerCase();
  const t = AI[locale];
  const sum = planetSummary(stations);
  const s = findStation(q);

  const isNational =
    anyKw(q, KW.national) ||
    ((anyKw(q, KW.summary) || anyKw(q, KW.whole)) && !s);
  const isRisk = anyKw(q, KW.risk);
  const isRec = anyKw(q, KW.rec);
  const isDefinitional = anyKw(q, KW.definitional);
  const isHotspot = anyKw(q, KW.hotspot);
  const isGreeting = KW.greeting.some((w) => hasWord(q, w));

  // 1 · Explicit national intent wins even when a place is also named.
  if (isNational) {
    return {
      text: `${t.modelNotice}\n\n${t.national({ count: stations.length, aqi: sum.meanAqi, aqiLabel: aqiLabel(sum.meanAqi, locale), sum })}`,
      citations: [t.cite.natBaseline, t.cite.natCities],
    };
  }

  // 2 · A named city — sub-route by intent, otherwise a full brief.
  if (s) {
    const name = cityName(s.id, s.name, locale);
    if (isRisk) {
      const drivers: string[] = [];
      if (s.aqi > 130) drivers.push(t.risk.air(s));
      if (s.industrialEmissions > 60) drivers.push(t.risk.industrial(s));
      if (s.climateRisk > 60) drivers.push(t.risk.exposure(s));
      if (s.waterQuality < 50) drivers.push(t.risk.water(s));
      if (s.biodiversity < 45) drivers.push(t.risk.habitat(s));
      if (drivers.length === 0) drivers.push(t.risk.none(s));
      return {
        text: `${t.modelNotice}\n\n${t.riskReply(name, drivers.map((d) => `- ${d}`).join("\n"))}`,
        citations: [t.cite.cluster(name), t.cite.riskModel, t.cite.seasonal],
      };
    }
    if (isRec) {
      const recs: string[] = [];
      if (s.aqi > 100) recs.push(t.recs.air);
      if (s.industrialEmissions > 60) recs.push(t.recs.industrial);
      if (s.waterQuality < 60) recs.push(t.recs.water);
      if (s.biodiversity < 55) recs.push(t.recs.habitat);
      if (s.climateRisk > 50) recs.push(t.recs.exposure);
      if (recs.length === 0) recs.push(t.recs.none);
      return {
        text: `${t.modelNotice}\n\n${t.recReply(name, recs.map((r, i) => `${i + 1}. ${r}`).join("\n"))}`,
        citations: [t.cite.cluster(name), t.cite.interventions],
      };
    }
    return {
      text: `${t.modelNotice}\n\n${t.brief(s, {
        name,
        region: regionLabel(s.region, locale),
        aqi: aqiLabel(s.aqi, locale),
        score: scoreLabel(s.sustainability, locale),
      })}\n\n${t.briefTail(name)}`,
      citations: [t.cite.cluster(name), t.cite.methodology],
    };
  }

  // 3 · Definitional question about a metric (no place in scope).
  if (isDefinitional) {
    const term = TERM_TRIGGERS.find((tt) => tt.match.some((m) => q.includes(m)));
    if (term) {
      return {
        text: t.terms[term.id],
        citations: [t.cite.methodologyShort, t.cite.who],
      };
    }
  }

  // 4 · Hotspot / industrial situation.
  if (isHotspot) {
    const top = [...HOTSPOTS].sort((a, b) => b.severity - a.severity).slice(0, 3);
    const body = top
      .map((h) => `- **${hotspotName(h.id, h.name, locale)}** (${regionLabel(h.region, locale)}) — ${h.severity}/100, ${h.status}. ${h.detail}.`)
      .join("\n");
    return {
      text: `${t.modelNotice}\n\n${t.hotspotReply({ total: sum.hotspots, critical: sum.criticalSites, body })}`,
      citations: [t.cite.firms, t.cite.industrialRegistry],
    };
  }

  // 5 · Greeting.
  if (isGreeting) {
    return { text: t.greeting, citations: [] };
  }

  // 6 · Fallback.
  return {
    text: t.fallback(stations.length),
    citations: [t.cite.natCities],
  };
}

const PROMPTS: Record<Locale, string[]> = {
  en: [
    "National summary",
    "How is Almaty doing?",
    "Risk outlook for Aralsk",
    "Recommendations for Temirtau",
    "What does PM10 mean?",
    "Industrial hotspots",
  ],
  ru: [
    "Национальная сводка",
    "Как дела в Алматы?",
    "Прогноз рисков для Аральска",
    "Рекомендации для Темиртау",
    "Что значит PM10?",
    "Промышленные горячие точки",
  ],
  kk: [
    "Ұлттық сводка",
    "Алматы қалай?",
    "Арал бойынша тәуекел болжамы",
    "Теміртау үшін ұсыныстар",
    "PM10 деген не?",
    "Өнеркәсіптік ошақтар",
  ],
};

export function suggestedPrompts(locale: Locale = "en"): string[] {
  return PROMPTS[locale];
}
