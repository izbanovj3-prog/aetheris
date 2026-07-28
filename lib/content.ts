/* ─────────────────────────────────────────────────────────────
   AETHERIS · Static-page content (i18n)
   Copy for the footer's Science/Company pages, in EN/RU/KK. Kept
   apart from lib/i18n.ts (chrome + landing) so neither file grows
   unwieldy. Presentational components read this via usePageContent().
   ───────────────────────────────────────────────────────────── */

import type { Locale } from "./i18n";

interface Section {
  title: string;
  body: string;
}

export interface PageContent {
  scienceKicker: string;
  companyKicker: string;
  methodology: {
    metaTitle: string;
    metaDescription: string;
    title: string;
    lede: string;
    sections: Section[];
  };
  dataSources: {
    metaTitle: string;
    metaDescription: string;
    title: string;
    lede: string;
    sources: Array<{ name: string; provides: string; status: string }>;
  };
  sensorNetwork: {
    metaTitle: string;
    metaDescription: string;
    title: string;
    lede: string;
    facts: Array<{ value: string; label: string }>;
    citiesTitle: string;
    citiesLede: string;
    inPrep: string;
  };
  mission: {
    metaTitle: string;
    metaDescription: string;
    title: string;
    lede: string;
    paragraphs: string[];
    /** How the project pays for itself — short, and explicit that it is
     *  the intended model rather than reported traction. */
    sustainTitle: string;
    sustainParagraphs: string[];
  };
  press: {
    metaTitle: string;
    metaDescription: string;
    title: string;
    lede: string;
    boilerplateTitle: string;
    boilerplate: string;
    nameNote: string;
    assetsTitle: string;
    assetLogo: string;
    assetSocial: string;
    paletteTitle: string;
    mediaTitle: string;
    mediaBody: string;
  };
  contact: {
    metaTitle: string;
    metaDescription: string;
    title: string;
    lede: string;
    channels: Array<{ title: string; body: string; actionLabel: string; href: string }>;
  };
}

const en: PageContent = {
  scienceKicker: "Science",
  companyKicker: "Company",
  methodology: {
    metaTitle: "Methodology",
    metaDescription:
      "How Aetheris turns raw environmental signals into the indices shown across the platform — and where the current model's limits are.",
    title: "Methodology",
    lede: "How Aetheris turns raw signals into the indices you see across the platform — and, just as important, which layers are measured and which are still modeled.",
    sections: [
      {
        title: "Air quality",
        body: "City-level AQI follows the US EPA 0–500 scale, derived from PM2.5, PM10 and NO₂ concentrations. Live readings come from the Open-Meteo Air Quality API (CAMS global model) and are merged over the model baseline on each visit; NO₂ is converted from µg/m³ to ppb for display.",
      },
      {
        title: "Water, biodiversity & industry",
        body: "Water Quality (WQI) and Industrial Load (IEI) are modeled from a deterministic regional baseline — no free real-time point feed exists for those layers yet, so treat them as indicative, not measured. Biodiversity is now split: the Biodiversity Intactness Index (BII) shown on the map and city pages is still that same modeled baseline, while a separate species-occurrence signal is live from GBIF — distinct species and occurrence records published within 50 km of each city over the last 10 years. The live signal reflects recording effort as well as ecology and does not feed into BII; the two are displayed side by side and badged separately. Industrial Load has a candidate live source that is not yet integrated: Copernicus Sentinel-5P / TROPOMI column densities for NO₂ and SO₂, which track industrial emission plumes. Adopting it means processing satellite scenes — through Google Earth Engine or equivalent — rather than the single REST call the air-quality and GBIF feeds need, so IEI stays modeled for now. For Water Quality no free real-time source covering Kazakhstan at this granularity has been identified at all. Alongside that gap sits the one signal here that is neither instrument nor model: community field reports, aggregated per city by category and severity over a rolling 30-day window and badged “Live · community”. It is real and current but self-reported, unverified against any instrument, and shaped by who happens to be looking — a city with no reports is a city nobody has reported from, not a clean one. It sits beside the modeled WQI and never feeds into it. Reports carry a status: everything arrives as “awaiting review”, and when two or more different devices report the same category in the same city within 72 hours the whole group moves to “corroborated”. That is corroboration between people, not verification — two reporters can be wrong together — and nothing is ever auto-promoted to “verified”.",
      },
      {
        title: "Composite risk",
        body: "The Environmental Risk Index (ERI) blends the layer indices with regional climate-risk weightings into a single 0–100 score per city.",
      },
      {
        title: "Validation",
        body: "Cross-checks between modeled values, live readings and community field reports are being formalised. This section will document the validation protocol and known error bounds.",
      },
    ],
  },
  dataSources: {
    metaTitle: "Data sources",
    metaDescription:
      "The canonical attribution list for every layer and headline figure on Aetheris.",
    title: "Data sources",
    lede: "Every number on Aetheris should be traceable. This page is the canonical attribution list — the ⓘ markers across the platform resolve here.",
    sources: [
      {
        name: "Open-Meteo Air Quality API",
        provides: "US AQI, PM2.5, PM10, NO₂ for all 28 monitored cities (CAMS global model)",
        status: "Live — fetched client-side on each visit",
      },
      {
        name: "Open-Meteo Weather API",
        provides: "Temperature and relative humidity per city",
        status: "Live — fetched client-side on each visit",
      },
      {
        name: "GBIF occurrence search",
        provides:
          "Species-occurrence signal per city — distinct species and occurrence records within 50 km over the last 10 years (api.gbif.org, no key required)",
        status: "Live — fetched client-side when a city page is opened",
      },
      {
        name: "Aetheris community reports",
        provides:
          "Per-city counts of public field reports by category and severity over a rolling 30-day window, plus the number of distinct devices that filed them",
        status: "Live · community — self-reported, unverified against instruments, and shaped by who is looking",
      },
      {
        name: "Aetheris baseline model",
        provides: "Water quality (WQI), biodiversity intactness (BII), industrial load (IEI) and risk (ERI) indices",
        status: "Modeled — deterministic regional baseline, refreshed per build",
      },
      {
        name: "Aetheris station registry",
        provides:
          "Headline network figures — live readings per day (cities × metrics × hourly upstream updates), station, region and hotspot counts",
        status: "Computed from the network registry at build time",
      },
    ],
  },
  sensorNetwork: {
    metaTitle: "Sensor network",
    metaDescription:
      "Coverage of the Aetheris monitoring network across Kazakhstan — cities, regions, hotspots and refresh cadence.",
    title: "Sensor network",
    lede: "Aetheris fuses satellite passes, public monitoring APIs and community reports into one national picture. Live air and weather readings refresh on every visit; modeled layers update with each platform build.",
    facts: [
      { value: "28", label: "Cities monitored — every oblast represented" },
      { value: "17", label: "Regions covered" },
      { value: "14", label: "Named environmental hotspots under continuous watch, from the Aral Sea to the Semipalatinsk Polygon" },
      { value: "5", label: "Layers per station: air, industry, water, biodiversity, risk" },
    ],
    citiesTitle: "Monitored cities",
    citiesLede: "Every city links to its live profile — current AQI, pollutant breakdown and health guidance.",
    inPrep: "A public, per-station inventory with hardware details and uptime history is in preparation.",
  },
  mission: {
    metaTitle: "Mission",
    metaDescription:
      "Why Aetheris exists: making Kazakhstan's environment legible to the people who live in it.",
    title: "Mission",
    lede: "The operating system for Kazakhstan's environment.",
    paragraphs: [
      "Kazakhstan carries some of the world's most consequential environmental stories — the Aral Sea, the Semipalatinsk Polygon, industrial corridors like Temirtau and Ekibastuz — yet the data describing them has lived scattered across agencies, formats and paywalls. Aetheris exists to close that gap: one living model of the country's air, water, industry and ecology that anyone can open.",
      "We build for three audiences at once. Scientists get traceable indices and honest uncertainty. Cities get decision-grade risk signals. Citizens get a map that tells them, plainly, what they are breathing today — and a way to report what the sensors can't see.",
      "Everything we publish aims to be verifiable: measured where a source exists, clearly labeled as modeled where one doesn't yet.",
    ],
    sustainTitle: "How this sustains itself",
    sustainParagraphs: [
      "The public map, the city pages, the action briefs and the assistant stay free for citizens. The people most exposed to these conditions are generally the least able to pay for information about them, and a paywalled environmental map is a contradiction in terms.",
      "Revenue is intended to come from the tier above that: licensed dashboard seats and API access for municipal environmental departments, industrial operators working under monitoring obligations, and research groups that need bulk historical series rather than a live view.",
      "In the near term the funding path is grant and institutional: oblast environmental programmes and international basin-restoration funds already procure monitoring of exactly this kind, and that is what carries the build-out of real water and industrial sensing.",
      "To be explicit: Aetheris has no paying customers today. This is the model we are building toward, not traction we are reporting.",
    ],
  },
  press: {
    metaTitle: "Press kit",
    metaDescription:
      "Official Aetheris boilerplate, name usage, logo assets and brand palette for media use.",
    title: "Press kit",
    lede: "Covering Aetheris? Use the boilerplate and assets below verbatim.",
    boilerplateTitle: "Boilerplate",
    boilerplate:
      "National environmental intelligence for Kazakhstan — real-time air quality plus modeled water, industrial emissions and ecological risk across every region and major city, in one living model.",
    nameNote:
      "The product name is written AETHERIS (all caps) or Aetheris in running text; the company is Aetheris Systems.",
    assetsTitle: "Assets",
    assetLogo: "Logo mark (SVG)",
    assetSocial: "Social card (PNG, 1200×630)",
    paletteTitle: "Palette",
    mediaTitle: "Media enquiries",
    mediaBody:
      "A dedicated press contact is being set up — for now, reach the team through the channels on the contact page.",
  },
  contact: {
    metaTitle: "Contact",
    metaDescription: "How to reach the Aetheris team.",
    title: "Contact",
    lede: "Reach the Aetheris team — pick the channel that fits.",
    channels: [
      {
        title: "Field reports & community",
        body: "Seen a pollution event, a die-off, an illegal discharge? File a geo-tagged report — it lands directly in the verification queue.",
        actionLabel: "Open the community hub",
        href: "/community",
      },
      {
        title: "Platform & data questions",
        body: "The AI analyst reads every layer of the model — live air quality and the modeled baseline alike — and answers with citations back to the source. Usually the fastest route.",
        actionLabel: "Ask the analyst",
        href: "/assistant",
      },
      {
        title: "Press & partnerships",
        body: "Direct mail channels are being set up. Until then, start from the press kit or the community hub and we will route you.",
        actionLabel: "View the press kit",
        href: "/press",
      },
    ],
  },
};

const ru: PageContent = {
  scienceKicker: "Наука",
  companyKicker: "Компания",
  methodology: {
    metaTitle: "Методология",
    metaDescription:
      "Как Aetheris превращает сырые экологические сигналы в индексы по всей платформе — и где пределы текущей модели.",
    title: "Методология",
    lede: "Как Aetheris превращает сырые сигналы в индексы, которые вы видите на платформе — и, что не менее важно, какие слои измеряются, а какие пока моделируются.",
    sections: [
      {
        title: "Качество воздуха",
        body: "Городской AQI считается по шкале US EPA 0–500 на основе концентраций PM2.5, PM10 и NO₂. Живые данные приходят из Open-Meteo Air Quality API (глобальная модель CAMS) и накладываются на модельную базу при каждом заходе; NO₂ переводится из µg/m³ в ppb для отображения.",
      },
      {
        title: "Вода, биоразнообразие и промышленность",
        body: "Индексы качества воды (WQI) и промышленной нагрузки (IEI) моделируются из детерминированной региональной базы — бесплатного потока в реальном времени для них пока нет, считайте их ориентировочными, а не измеренными. С биоразнообразием теперь два разных показателя: индекс сохранности (BII) на карте и страницах городов остаётся модельным, а рядом появился живой сигнал встречаемости видов из GBIF — число видов и записей наблюдений в радиусе 50 км за последние 10 лет. Живой сигнал отражает и интенсивность наблюдений, а не только экологию, и в BII не входит: показатели выводятся рядом и маркируются отдельно. У промышленной нагрузки есть кандидат на живой источник, пока не подключённый: колоночные концентрации NO₂ и SO₂ со спутника Copernicus Sentinel-5P / TROPOMI — они отслеживают шлейфы промышленных выбросов. Чтобы их использовать, нужна обработка спутниковых сцен (через Google Earth Engine или аналог), а не один REST-запрос, как у воздуха и GBIF, поэтому IEI пока остаётся модельным. Для качества воды бесплатного источника реального времени с нужной детализацией по Казахстану не найдено вовсе. Рядом с этим пробелом стоит единственный показатель, который не является ни прибором, ни моделью: полевые отчёты сообщества, сведённые по городу в разрезе категорий и тяжести за скользящие 30 дней и помеченные «Live · сообщество». Он реален и актуален, но это самоотчёты, не сверенные ни с одним прибором и зависящие от того, кто смотрит: город без отчётов — это город, откуда никто не написал, а не чистый город. Он стоит рядом с модельным WQI и в него не входит. У отчётов есть статус: все приходят как «ожидает проверки», а когда два и более разных устройства сообщают об одной категории в одном городе в пределах 72 часов, вся группа переходит в «подтверждено другими». Это подтверждение людьми, а не верификация — двое могут ошибаться одинаково — и до статуса «проверено» автоматически не поднимается ничего.",
      },
      {
        title: "Совокупный риск",
        body: "Индекс экологического риска (ERI) объединяет индексы слоёв с региональными весами климатического риска в единую оценку 0–100 на каждый город.",
      },
      {
        title: "Валидация",
        body: "Сверка модельных значений, живых данных и полевых отчётов сообщества сейчас формализуется. В этом разделе будет описан протокол валидации и известные границы погрешности.",
      },
    ],
  },
  dataSources: {
    metaTitle: "Источники данных",
    metaDescription:
      "Канонический перечень атрибуции для каждого слоя и ключевой цифры на Aetheris.",
    title: "Источники данных",
    lede: "Каждая цифра на Aetheris должна быть прослеживаемой. Эта страница — канонический перечень атрибуции, куда ведут маркеры ⓘ по всей платформе.",
    sources: [
      {
        name: "Open-Meteo Air Quality API",
        provides: "US AQI, PM2.5, PM10, NO₂ для всех 28 городов под наблюдением (глобальная модель CAMS)",
        status: "Живой — запрашивается на клиенте при каждом заходе",
      },
      {
        name: "Open-Meteo Weather API",
        provides: "Температура и относительная влажность по каждому городу",
        status: "Живой — запрашивается на клиенте при каждом заходе",
      },
      {
        name: "GBIF occurrence search",
        provides:
          "Сигнал встречаемости видов по городам — число видов и записей наблюдений в радиусе 50 км за последние 10 лет (api.gbif.org, без ключа)",
        status: "Живой — запрашивается на клиенте при открытии страницы города",
      },
      {
        name: "Отчёты сообщества Aetheris",
        provides:
          "Число публичных полевых отчётов по городу в разрезе категорий и тяжести за скользящие 30 дней, плюс количество разных устройств-авторов",
        status: "Live · сообщество — самоотчёты, не сверенные с приборами, зависят от того, кто смотрит",
      },
      {
        name: "Базовая модель Aetheris",
        provides: "Индексы качества воды (WQI), биоразнообразия (BII), промышленной нагрузки (IEI) и риска (ERI)",
        status: "Модельный — детерминированная региональная база, обновляется при каждой сборке",
      },
      {
        name: "Реестр станций Aetheris",
        provides:
          "Ключевые цифры сети — живых замеров в сутки (города × метрики × почасовые обновления), число станций, регионов и горячих точек",
        status: "Вычисляется из реестра сети при сборке",
      },
    ],
  },
  sensorNetwork: {
    metaTitle: "Сеть станций",
    metaDescription:
      "Покрытие сети мониторинга Aetheris по Казахстану — города, регионы, горячие точки и частота обновления.",
    title: "Сеть станций",
    lede: "Aetheris объединяет спутниковые пролёты, публичные API мониторинга и отчёты сообщества в единую национальную картину. Живые данные по воздуху и погоде обновляются при каждом заходе; модельные слои — при каждой сборке платформы.",
    facts: [
      { value: "28", label: "Городов под наблюдением — представлена каждая область" },
      { value: "17", label: "Регионов покрыто" },
      { value: "14", label: "Именованных экологических горячих точек под постоянным контролем — от Аральского моря до Семипалатинского полигона" },
      { value: "5", label: "Слоёв на станцию: воздух, промышленность, вода, биоразнообразие, риск" },
    ],
    citiesTitle: "Города под наблюдением",
    citiesLede: "Каждый город ведёт на свой живой профиль — текущий AQI, разбивка по загрязнителям и рекомендации для здоровья.",
    inPrep: "Публичный постанционный реестр с характеристиками оборудования и историей аптайма готовится.",
  },
  mission: {
    metaTitle: "Миссия",
    metaDescription:
      "Зачем существует Aetheris: сделать экологию Казахстана понятной тем, кто в нём живёт.",
    title: "Миссия",
    lede: "Операционная система для экологии Казахстана.",
    paragraphs: [
      "Казахстан хранит одни из самых значимых экологических историй в мире — Аральское море, Семипалатинский полигон, промышленные коридоры вроде Темиртау и Экибастуза — но данные о них жили разрозненно: по разным ведомствам, форматам и платным доступам. Aetheris существует, чтобы закрыть этот разрыв: одна живая модель воздуха, воды, промышленности и экологии страны, которую может открыть каждый.",
      "Мы строим сразу для трёх аудиторий. Учёные получают прослеживаемые индексы и честную неопределённость. Города — сигналы риска уровня принятия решений. Граждане — карту, которая прямо говорит, чем они дышат сегодня, и способ сообщить о том, чего не видят сенсоры.",
      "Всё, что мы публикуем, стремится быть проверяемым: измерено там, где источник есть, и явно помечено как модельное там, где источника пока нет.",
    ],
    sustainTitle: "На что это существует",
    sustainParagraphs: [
      "Публичная карта, страницы городов, планы действий и ассистент остаются бесплатными для граждан. Те, кто сильнее всего подвержен этим условиям, как правило, меньше всего способны платить за информацию о них, а экологическая карта за платной стеной — противоречие сама по себе.",
      "Доход предполагается с уровня выше: лицензионные места в дашборде и доступ к API для городских управлений экологии, промышленных операторов с обязательствами по мониторингу и исследовательских групп, которым нужны массивы исторических рядов, а не живая картинка.",
      "В ближайшей перспективе путь финансирования — гранты и институциональные средства: областные экологические программы и международные фонды восстановления бассейнов уже закупают мониторинг ровно такого типа, и именно это оплачивает разворачивание реальных датчиков воды и промышленных выбросов.",
      "Прямо и без прикрас: платящих клиентов у Aetheris сегодня нет. Это модель, к которой мы идём, а не результаты, о которых мы отчитываемся.",
    ],
  },
  press: {
    metaTitle: "Пресс-кит",
    metaDescription:
      "Официальный текст об Aetheris, использование названия, логотип и палитра бренда для СМИ.",
    title: "Пресс-кит",
    lede: "Пишете об Aetheris? Используйте текст и материалы ниже дословно.",
    boilerplateTitle: "Официальный текст",
    boilerplate:
      "Национальная экологическая аналитика Казахстана — качество воздуха в реальном времени плюс модельные вода, промышленные выбросы и экологические риски по всем регионам и крупным городам в одной живой модели.",
    nameNote:
      "Название продукта пишется AETHERIS (заглавными) или Aetheris в тексте; компания — Aetheris Systems.",
    assetsTitle: "Материалы",
    assetLogo: "Логотип (SVG)",
    assetSocial: "Соцкарточка (PNG, 1200×630)",
    paletteTitle: "Палитра",
    mediaTitle: "Запросы СМИ",
    mediaBody:
      "Отдельный пресс-контакт настраивается — пока свяжитесь с командой по каналам на странице контактов.",
  },
  contact: {
    metaTitle: "Контакты",
    metaDescription: "Как связаться с командой Aetheris.",
    title: "Контакты",
    lede: "Свяжитесь с командой Aetheris — выберите подходящий канал.",
    channels: [
      {
        title: "Полевые отчёты и сообщество",
        body: "Заметили загрязнение, замор, незаконный сброс? Отправьте геометку-отчёт — он попадёт прямо в очередь проверки.",
        actionLabel: "Открыть хаб сообщества",
        href: "/community",
      },
      {
        title: "Вопросы о платформе и данных",
        body: "ИИ-аналитик читает каждый слой модели — и живое качество воздуха, и модельную базовую линию — и отвечает со ссылками на источники. Обычно это самый быстрый путь.",
        actionLabel: "Спросить аналитика",
        href: "/assistant",
      },
      {
        title: "Пресса и партнёрства",
        body: "Прямые почтовые каналы настраиваются. Пока начните с пресс-кита или хаба сообщества — мы вас направим.",
        actionLabel: "Открыть пресс-кит",
        href: "/press",
      },
    ],
  },
};

const kk: PageContent = {
  scienceKicker: "Ғылым",
  companyKicker: "Компания",
  methodology: {
    metaTitle: "Әдіснама",
    metaDescription:
      "Aetheris шикі экологиялық сигналдарды платформадағы индекстерге қалай айналдырады — және қазіргі модельдің шектеулері қайда.",
    title: "Әдіснама",
    lede: "Aetheris шикі сигналдарды платформада көретін индекстерге қалай айналдырады — және бірдей маңыздысы: қай қабаттар өлшенеді, қайсысы әлі модельденеді.",
    sections: [
      {
        title: "Ауа сапасы",
        body: "Қалалық AQI PM2.5, PM10 және NO₂ концентрацияларынан алынған US EPA 0–500 шкаласымен есептеледі. Тірі деректер Open-Meteo Air Quality API-ден (жаһандық CAMS моделі) келеді және әр кіргенде модельдік базаның үстіне жинақталады; NO₂ көрсету үшін µg/m³-тен ppb-ге аударылады.",
      },
      {
        title: "Су, биоалуантүрлілік және өнеркәсіп",
        body: "Су сапасы (WQI) және өнеркәсіп жүктемесі (IEI) индекстері детерминирленген өңірлік базадан модельденеді — олар үшін тегін нақты уақыт ағыны әлі жоқ, сондықтан оларды өлшенген емес, бағдарлы деп есептеңіз. Биоалуантүрлілік енді екіге бөлінді: картадағы және қала беттеріндегі сақталу индексі (BII) сол модельдік база күйінде қалады, ал қасында GBIF-тен тірі түрлер кездесуінің сигналы пайда болды — әр қаладан 50 км радиуста соңғы 10 жылда жарияланған түрлер мен бақылау жазбаларының саны. Тірі сигнал экологияны ғана емес, бақылау белсенділігін де көрсетеді және BII-ге кірмейді: екеуі қатар шығып, бөлек таңбаланады. Өнеркәсіптік жүктеме үшін әзірге қосылмаған үміткер дереккөз бар: Copernicus Sentinel-5P / TROPOMI жерсерігінің NO₂ және SO₂ бағаналық концентрациялары — олар өнеркәсіптік шығарынды шлейфтерін бақылайды. Оны пайдалану үшін бір REST-сұрау емес, жерсерік кадрларын өңдеу керек (Google Earth Engine немесе баламасы арқылы), сондықтан IEI әзірге модельдік күйінде қалады. Су сапасы үшін Қазақстан бойынша қажетті егжей-тегжейлі тегін нақты уақыт дереккөзі мүлдем табылған жоқ. Осы олқылықтың қасында аспап та, модель де емес жалғыз көрсеткіш тұр: қала бойынша санаттар мен ауырлық бойынша соңғы 30 күнде жинақталған, «Live · қауымдастық» деп белгіленген қауымдастықтың далалық есептері. Ол нақты әрі өзекті, бірақ өзін-өзі есептеу: ешбір аспаппен тексерілмеген және кім қарайтынына тәуелді — есебі жоқ қала таза қала емес, одан ешкім жазбаған. Ол модельдік WQI-дың қасында тұрады және оған кірмейді. Есептердің мәртебесі бар: бәрі «тексеруді күтуде» болып келеді, ал бір қалада бір санат бойынша 72 сағат ішінде екі не одан көп түрлі құрылғы хабарласа, бүкіл топ «өзгелермен расталды» күйіне ауысады. Бұл адамдардың растауы, верификация емес — екеуі бірдей қателесуі мүмкін — және ешнәрсе автоматты түрде «тексерілді» дәрежесіне көтерілмейді.",
      },
      {
        title: "Жиынтық тәуекел",
        body: "Экологиялық тәуекел индексі (ERI) қабат индекстерін өңірлік климаттық тәуекел салмақтарымен әр қалаға арналған бірыңғай 0–100 бағаға біріктіреді.",
      },
      {
        title: "Валидация",
        body: "Модельдік мәндер, тірі деректер және қауымдастықтың далалық есептері арасындағы салыстыру ресімделуде. Бұл бөлімде валидация хаттамасы мен белгілі қателік шектері сипатталады.",
      },
    ],
  },
  dataSources: {
    metaTitle: "Дерек көздері",
    metaDescription:
      "Aetheris-тегі әрбір қабат пен негізгі көрсеткіш үшін атрибуцияның канондық тізімі.",
    title: "Дерек көздері",
    lede: "Aetheris-тегі әр сан бақыланатын болуы керек. Бұл бет — атрибуцияның канондық тізімі, платформадағы ⓘ белгілері осында бағыттайды.",
    sources: [
      {
        name: "Open-Meteo Air Quality API",
        provides: "Бақылаудағы барлық 28 қала үшін US AQI, PM2.5, PM10, NO₂ (жаһандық CAMS моделі)",
        status: "Тірі — әр кіргенде клиент жағында сұралады",
      },
      {
        name: "Open-Meteo Weather API",
        provides: "Әр қала бойынша температура және салыстырмалы ылғалдылық",
        status: "Тірі — әр кіргенде клиент жағында сұралады",
      },
      {
        name: "GBIF occurrence search",
        provides:
          "Қалалар бойынша түрлердің кездесу сигналы — 50 км радиуста соңғы 10 жылдағы түрлер мен бақылау жазбаларының саны (api.gbif.org, кілтсіз)",
        status: "Тірі — қала беті ашылғанда клиент жағында сұралады",
      },
      {
        name: "Aetheris қауымдастық есептері",
        provides:
          "Соңғы 30 күндегі қала бойынша қоғамдық далалық есептердің санаттар мен ауырлық бойынша саны, сондай-ақ жіберген құрылғылар саны",
        status: "Live · қауымдастық — өзін-өзі есептеу, аспаппен тексерілмеген, кім қарайтынына тәуелді",
      },
      {
        name: "Aetheris базалық моделі",
        provides: "Су сапасы (WQI), биоалуантүрлілік (BII), өнеркәсіп жүктемесі (IEI) және тәуекел (ERI) индекстері",
        status: "Модельдік — детерминирленген өңірлік база, әр құрастыруда жаңарады",
      },
      {
        name: "Aetheris станциялар тізілімі",
        provides:
          "Желінің негізгі көрсеткіштері — тәулігіне тірі өлшем (қалалар × метрикалар × сағаттық жаңартулар), станция, өңір және ошақ саны",
        status: "Құрастыру кезінде желі тізілімінен есептеледі",
      },
    ],
  },
  sensorNetwork: {
    metaTitle: "Станциялар желісі",
    metaDescription:
      "Aetheris мониторинг желісінің Қазақстан бойынша қамтуы — қалалар, өңірлер, ошақтар және жаңару жиілігі.",
    title: "Станциялар желісі",
    lede: "Aetheris спутниктік өтулерді, көпшілік мониторинг API-лерін және қауымдастық есептерін бірыңғай ұлттық суретке біріктіреді. Ауа мен ауа райы бойынша тірі деректер әр кіргенде жаңарады; модельдік қабаттар платформаның әр құрастыруымен.",
    facts: [
      { value: "28", label: "Бақылаудағы қалалар — әр облыс ұсынылған" },
      { value: "17", label: "Қамтылған өңірлер" },
      { value: "14", label: "Тұрақты бақылаудағы аталған экологиялық ошақтар — Арал теңізінен Семей полигонына дейін" },
      { value: "5", label: "Станцияға шаққандағы қабаттар: ауа, өнеркәсіп, су, биоалуантүрлілік, тәуекел" },
    ],
    citiesTitle: "Бақылаудағы қалалар",
    citiesLede: "Әр қала өзінің тірі профиліне бағыттайды — ағымдағы AQI, ластағыштар бөлінісі және денсаулық ұсыныстары.",
    inPrep: "Жабдық сипаттамалары мен аптайм тарихы бар көпшілік станциялық тізілім дайындалуда.",
  },
  mission: {
    metaTitle: "Миссия",
    metaDescription:
      "Aetheris не үшін бар: Қазақстан экологиясын онда тұратындарға түсінікті ету.",
    title: "Миссия",
    lede: "Қазақстан экологиясының операциялық жүйесі.",
    paragraphs: [
      "Қазақстан әлемдегі ең маңызды экологиялық оқиғалардың бірін сақтайды — Арал теңізі, Семей полигоны, Теміртау мен Екібастұз секілді өнеркәсіп дәліздері — бірақ ол туралы деректер ведомстволар, форматтар мен ақылы қолжетімділік арасында шашырап жатты. Aetheris осы алшақтықты жою үшін бар: елдің ауасы, суы, өнеркәсібі мен экологиясының кез келген адам аша алатын бір тірі моделі.",
      "Біз бірден үш аудиторияға құрамыз. Ғалымдар бақыланатын индекстер мен адал белгісіздік алады. Қалалар — шешім қабылдау деңгейіндегі тәуекел сигналдарын. Азаматтар — бүгін немен тыныс алатынын анық айтатын картаны және сенсорлар көрмейтінін хабарлау мүмкіндігін.",
      "Біз жариялайтын барлық нәрсе тексерілетін болуға тырысады: дереккөз бар жерде өлшенген, әлі жоқ жерде анық модельдік деп белгіленген.",
    ],
    sustainTitle: "Бұл немен қаржыландырылады",
    sustainParagraphs: [
      "Ашық карта, қала беттері, іс-қимыл жоспарлары және ассистент азаматтар үшін тегін болып қала береді. Осы жағдайларға көбірек ұшырайтындар, әдетте, олар туралы ақпаратқа төлеуге ең аз мүмкіндігі барлар, ал ақылы қабырға артындағы экологиялық карта — өз-өзіне қайшылық.",
      "Табыс одан жоғары деңгейден күтіледі: қалалық экология басқармалары, мониторинг міндеттемелері бар өнеркәсіптік операторлар және тірі көрініс емес, тарихи қатарлар массиві қажет зерттеу топтары үшін лицензияланған дашборд орындары мен API-қолжетімділік.",
      "Жақын мерзімде қаржыландыру жолы — гранттар мен институционалдық қаражат: облыстық экологиялық бағдарламалар мен бассейндерді қалпына келтірудің халықаралық қорлары дәл осындай мониторингті сатып алады, және нақты су мен өнеркәсіптік сенсорларды орналастыруды осы қаржыландырады.",
      "Ашық айтамыз: бүгінде Aetheris-те төлейтін клиенттер жоқ. Бұл — біз ұмтылып жатқан модель, есеп беріп отырған нәтиже емес.",
    ],
  },
  press: {
    metaTitle: "Баспасөз жинағы",
    metaDescription:
      "Aetheris туралы ресми мәтін, атау қолданысы, логотип және БАҚ үшін бренд палитрасы.",
    title: "Баспасөз жинағы",
    lede: "Aetheris туралы жазып жатырсыз ба? Төмендегі мәтін мен материалдарды сөзбе-сөз пайдаланыңыз.",
    boilerplateTitle: "Ресми мәтін",
    boilerplate:
      "Қазақстанның ұлттық экологиялық аналитикасы — нақты уақыттағы ауа сапасы, сондай-ақ модельдік су, өнеркәсіптік шығарындылар және экологиялық тәуекелдер, барлық өңірлер мен ірі қалалар бір тірі модельде.",
    nameNote:
      "Өнім атауы AETHERIS (бас әріппен) немесе мәтінде Aetheris деп жазылады; компания — Aetheris Systems.",
    assetsTitle: "Материалдар",
    assetLogo: "Логотип (SVG)",
    assetSocial: "Әлеуметтік карточка (PNG, 1200×630)",
    paletteTitle: "Палитра",
    mediaTitle: "БАҚ сұраулары",
    mediaBody:
      "Жеке баспасөз байланысы орнатылуда — әзірге командаға байланыс бетіндегі арналар арқылы хабарласыңыз.",
  },
  contact: {
    metaTitle: "Байланыс",
    metaDescription: "Aetheris командасымен қалай байланысуға болады.",
    title: "Байланыс",
    lede: "Aetheris командасымен байланысыңыз — қолайлы арнаны таңдаңыз.",
    channels: [
      {
        title: "Далалық есептер мен қауымдастық",
        body: "Ластануды, жаппай қырылуды, заңсыз төгіндіні байқадыңыз ба? Геобелгісі бар есеп жіберіңіз — ол тексеру кезегіне тікелей түседі.",
        actionLabel: "Қауымдастық хабын ашу",
        href: "/community",
      },
      {
        title: "Платформа мен деректер сұрақтары",
        body: "ЖИ-аналитик модельдің әр қабатын оқиды — тірі ауа сапасын да, модельдік базалық сызықты да — және дереккөздерге сілтемемен жауап береді. Әдетте ең жылдам жол.",
        actionLabel: "Аналитиктен сұрау",
        href: "/assistant",
      },
      {
        title: "Баспасөз және серіктестік",
        body: "Тікелей пошта арналары орнатылуда. Әзірге баспасөз жинағынан немесе қауымдастық хабынан бастаңыз — біз бағыттаймыз.",
        actionLabel: "Баспасөз жинағын ашу",
        href: "/press",
      },
    ],
  },
};

const CONTENT: Record<Locale, PageContent> = { en, ru, kk };

export function getPageContent(locale: Locale): PageContent {
  return CONTENT[locale];
}
