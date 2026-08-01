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
        title: "Independence",
        body: "Aetheris is an independent student project. It is not affiliated with, endorsed by, or operated in partnership with Kazhydromet or any government agency unless explicitly stated. Agencies, operators and monitoring services named anywhere on this site — including in community field reports — are named as subjects of public environmental data, not as partners, sources of endorsement, or reviewers of anything published here.",
      },
      {
        title: "Water, biodiversity & industry",
        body: "Water Quality (WQI) and Industrial Load (IEI) are modeled from a deterministic regional baseline — no free real-time point feed exists for those layers yet, so treat them as indicative, not measured. Biodiversity is now split: the Biodiversity Intactness Index (BII) shown on the map and city pages is still that same modeled baseline, while a separate species-occurrence signal is live from GBIF — distinct species and occurrence records published within 50 km of each city over the last 10 years. The live signal reflects recording effort as well as ecology and does not feed into BII; the two are displayed side by side and badged separately. Industrial Load has a candidate live source that is not yet integrated: Copernicus Sentinel-5P / TROPOMI column densities for NO₂ and SO₂, which track industrial emission plumes. Adopting it means processing satellite scenes — through Google Earth Engine or equivalent — rather than the single REST call the air-quality and GBIF feeds need, so IEI stays modeled for now. For Water Quality no free real-time source covering Kazakhstan at this granularity has been identified at all. Alongside that gap sits the one signal here that is neither instrument nor model: community field reports, aggregated per city by category and severity over a rolling 30-day window and badged “Live · community”. It is real and current but self-reported, unverified against any instrument, and shaped by who happens to be looking — a city with no reports is a city nobody has reported from, not a clean one. It sits beside the modeled WQI and never feeds into it. Reports carry one of five statuses, described in full under “Community report statuses” below.",
      },
      {
        title: "Community report statuses",
        body: "A field report moves through a fixed vocabulary of five, and what is missing from it is deliberate. ① “Отправлен” (Submitted) is the default and everything a submission ever claims about itself: filed and stored, read by nobody. ② “AI-контекст добавлен” (AI context attached) means Aetheris Analyst put a live reading beside it — the nearest Open-Meteo/CAMS air-quality station for air and industrial reports, or the GBIF occurrence record for biodiversity ones. That context is computed in the browser at page load from the same feeds the city pages use, so it is never stored and no client can write the platform's own framing into the database; it is also a reading from now rather than from when the report was filed, which the bubble says on its face. There is no satellite cross-check of photographs and no placeholder pretending there is: that would need commercial imagery archives at a resolution and revisit rate this project has no access to. ③ “Corroborated сообществом” (Corroborated by the community) is the existing rule — two or more different devices reporting the same category in the same city within 72 hours. That is corroboration between people, not verification: two reporters can be wrong together, and no instrument has checked either. ④ “Передано в акимат/эко-инспекцию” (Forwarded) records that data was handed to a public body, with who sent it, when and where kept in a publicly readable log; it is an event in the report's history, not an assessment of it, and it says nothing about how or whether the recipient responded. ⑤ “Ответ организации” (Organisation response) appears only when an organisation that has agreed to appear on this platform leaves a comment, quoted as sent and attributed by name. ④ and ⑤ can only be set by a team member holding the service key — the database functions behind them have execute revoked from anonymous visitors, so nobody can mark their own report as forwarded to a government body or invent a reply from one. There is no “verified” status and no “resolved” status. Aetheris has no moderators, no instrument check standing behind a field report and no legal responsibility for verification, so it does not print a word that claims any of the three.",
      },
      {
        title: "Composite risk",
        body: "The Environmental Risk Index (ERI) blends the layer indices with regional climate-risk weightings into a single 0–100 score per city.",
      },
      {
        title: "Validation",
        body: "Cross-checks between modeled values, live readings and community field reports are being formalised. This section will document the validation protocol and known error bounds. What exists today is narrower and should not be mistaken for it: a live reading placed beside a report as context (status ②), and corroboration between independent reporters (status ③). Neither is a validation step.",
      },
      {
        title: "Eco-Points, ranks and badges",
        body: "Contributors accumulate Eco-Points: 10 for filing a report, 25 when it reaches “Corroborated сообществом”, 5 when the attached photo clears a resolution and sharpness check, and 15 for a follow-up update on one of your own earlier reports. Points are called Eco-Points and nothing else — they are not tokens, cannot be transferred or redeemed, carry no monetary value, and gate nothing on the platform. Because Aetheris has no accounts, they are computed in the visitor's own browser from that browser's own reports and are cleared with site data; one person on two devices counts as two contributors, and the inputs a client writes (the photo-quality flag, the follow-up link) are self-declared. The rank ladder extends the names already used here — Newcomer (written «Новичок» in the concept), Observer I–III, Field Researcher, Eco-Inspector, Sentinel I–III, Constellation — and the five geographic badges cover Almaty, the Aral basin, the Temirtau–Karaganda industrial belt, the Balkhash basin and the Caspian shore.",
      },
      {
        title: "Events and check-in",
        body: "Anyone can create a community event and RSVP to one, capped at three new events per device per day. Check-in is the only thing on the platform that asserts someone was physically in a place, so its rules are enforced in the database rather than in the browser: within 500 m of the event's pin, and from an hour before the start until four hours after it. Coordinates still come from the visitor's own device, so this stops the accidental and the casual case, not a deliberate forgery. Two known limits, stated rather than hidden: participant caps are checked before the write rather than locked, so two people can take the last place at once; and because an anonymous device id cannot be proved, an RSVP can be withdrawn by anyone who knows it. Both close when the platform has real accounts. No report data is reachable either way.",
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
        name: "AI-контекст on report cards",
        provides:
          "The context bubble under a field report — no new source of its own. Air and industrial reports quote the nearest Open-Meteo/CAMS station; biodiversity reports quote the GBIF occurrence record for the area. Both are the rows above, read at page load and placed beside the report",
        status: "Derived — context, never a verdict, and never stored; recomputed in the browser on each visit",
      },
      {
        name: "Aetheris community events",
        provides:
          "Visitor-created events with RSVPs and geo-fenced check-ins. Check-in position comes from the visitor's own device and is accepted only within 500 m of the event and inside its time window",
        status: "Live · community — self-organised and self-reported; Aetheris neither runs nor vets these gatherings",
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
        body: "Seen a pollution event, a die-off, an illegal discharge? File a geo-tagged report — it is stored and public straight away. There is no review queue behind it and nobody checks it; what can happen next is a live reading placed beside it, or another person reporting the same thing.",
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
        title: "Независимость",
        body: "Aetheris — независимый студенческий проект. Он не аффилирован с Казгидрометом или каким-либо государственным органом, не одобрен ими и не работает с ними в партнёрстве, если прямо не указано иное. Ведомства, предприятия и службы мониторинга, упомянутые где-либо на сайте — в том числе в полевых отчётах сообщества, — названы как объекты открытых экологических данных, а не как партнёры, источники одобрения или рецензенты чего-либо здесь опубликованного.",
      },
      {
        title: "Вода, биоразнообразие и промышленность",
        body: "Индексы качества воды (WQI) и промышленной нагрузки (IEI) моделируются из детерминированной региональной базы — бесплатного потока в реальном времени для них пока нет, считайте их ориентировочными, а не измеренными. С биоразнообразием теперь два разных показателя: индекс сохранности (BII) на карте и страницах городов остаётся модельным, а рядом появился живой сигнал встречаемости видов из GBIF — число видов и записей наблюдений в радиусе 50 км за последние 10 лет. Живой сигнал отражает и интенсивность наблюдений, а не только экологию, и в BII не входит: показатели выводятся рядом и маркируются отдельно. У промышленной нагрузки есть кандидат на живой источник, пока не подключённый: колоночные концентрации NO₂ и SO₂ со спутника Copernicus Sentinel-5P / TROPOMI — они отслеживают шлейфы промышленных выбросов. Чтобы их использовать, нужна обработка спутниковых сцен (через Google Earth Engine или аналог), а не один REST-запрос, как у воздуха и GBIF, поэтому IEI пока остаётся модельным. Для качества воды бесплатного источника реального времени с нужной детализацией по Казахстану не найдено вовсе. Рядом с этим пробелом стоит единственный показатель, который не является ни прибором, ни моделью: полевые отчёты сообщества, сведённые по городу в разрезе категорий и тяжести за скользящие 30 дней и помеченные «Live · сообщество». Он реален и актуален, но это самоотчёты, не сверенные ни с одним прибором и зависящие от того, кто смотрит: город без отчётов — это город, откуда никто не написал, а не чистый город. Он стоит рядом с модельным WQI и в него не входит. У отчётов есть один из пяти статусов — они полностью описаны ниже, в разделе «Статусы отчётов сообщества».",
      },
      {
        title: "Статусы отчётов сообщества",
        body: "Отчёт движется по фиксированному словарю из пяти статусов, и то, чего в нём нет, отсутствует намеренно. ① «Отправлен» — статус по умолчанию и всё, что отчёт о себе утверждает: сохранён, никем не прочитан. ② «AI-контекст добавлен» означает, что Aetheris Analyst поставил рядом живой замер — ближайшую станцию Open-Meteo/CAMS для воздуха и промышленных выбросов или запись встречаемости GBIF для биоразнообразия. Этот контекст считается в браузере при загрузке страницы из тех же потоков, что и страницы городов, поэтому он нигде не хранится и ни один клиент не может записать в базу формулировку от лица платформы; это к тому же замер «сейчас», а не на момент подачи, и сам блок об этом прямо говорит. Спутниковой сверки фотографий нет и заглушки, изображающей её, тоже нет: для неё нужны коммерческие архивы съёмки с разрешением и частотой, к которым у проекта нет доступа. ③ «Corroborated сообществом» — уже существовавшее правило: два и более разных устройства сообщают об одной категории в одном городе в пределах 72 часов. Это подтверждение людьми, а не верификация: двое могут ошибаться одинаково, и ни один прибор их не проверял. ④ «Передано в акимат/эко-инспекцию» фиксирует, что данные переданы государственному органу, с открытым логом кто, когда и куда передал; это событие в истории отчёта, а не его оценка, и оно ничего не говорит о том, как и ответил ли получатель. ⑤ «Ответ организации» появляется только тогда, когда организация, согласившаяся присутствовать на платформе, оставила комментарий — он приводится дословно и с указанием её имени. ④ и ⑤ может проставить только участник команды с сервисным ключом: у функций базы, которые их пишут, отозвано право выполнения для анонимных посетителей, поэтому никто не может пометить свой отчёт как переданный в госорган или выдумать ответ от него. Статусов «проверено» и «решено» нет. У Aetheris нет модераторов, нет приборной проверки полевого отчёта и нет юридической ответственности за верификацию — поэтому платформа не печатает слово, которое утверждало бы хоть одно из трёх.",
      },
      {
        title: "Совокупный риск",
        body: "Индекс экологического риска (ERI) объединяет индексы слоёв с региональными весами климатического риска в единую оценку 0–100 на каждый город.",
      },
      {
        title: "Валидация",
        body: "Сверка модельных значений, живых данных и полевых отчётов сообщества сейчас формализуется. В этом разделе будет описан протокол валидации и известные границы погрешности. То, что есть сегодня, уже́ и не должно приниматься за неё: живой замер, поставленный рядом с отчётом как контекст (статус ②), и подтверждение между независимыми людьми (статус ③). Ни то, ни другое валидацией не является.",
      },
      {
        title: "Eco-Points, ранги и бейджи",
        body: "Участники накапливают Eco-Points: 10 за поданный отчёт, 25 когда он доходит до «Corroborated сообществом», 5 если приложенное фото проходит проверку разрешения и резкости, и 15 за апдейт по своему же прошлому отчёту. Механика называется Eco-Points и никак иначе — это не токены, их нельзя передать или обменять, они не имеют денежной ценности и ничего на платформе не открывают. Поскольку у Aetheris нет аккаунтов, они считаются в браузере самого посетителя по отчётам этого же браузера и стираются вместе с данными сайта; один человек с двух устройств для платформы — два участника, а поля, которые пишет клиент (флаг качества фото, ссылка на исходный отчёт), заявляются им самим. Лестница рангов расширяет уже использовавшиеся здесь названия — Новичок, Observer I–III, Field Researcher, Eco-Inspector, Sentinel I–III, Constellation, — а пять географических бейджей покрывают Алматы, Аральский бассейн, промышленный пояс Темиртау–Караганда, бассейн Балхаша и Каспийское побережье.",
      },
      {
        title: "События и чек-ин",
        body: "Любой может создать событие сообщества и записаться на чужое, с лимитом в три новых события на устройство в сутки. Чек-ин — единственное на платформе, что утверждает физическое присутствие человека в месте, поэтому его правила проверяются в базе, а не в браузере: не дальше 500 м от пина события и в окне от часа до начала до четырёх часов после. Координаты всё равно приходят с устройства посетителя, так что это отсекает случайное и небрежное, но не намеренную подделку. Два известных ограничения, названных прямо: лимит участников проверяется до записи, а не блокировкой, поэтому двое могут занять последнее место одновременно; и поскольку анонимный идентификатор устройства нельзя доказать, запись на событие может снять любой, кто его знает. Оба закрываются, когда на платформе появятся настоящие аккаунты. Ни в том, ни в другом случае данные отчётов недоступны.",
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
        name: "AI-контекст на карточках отчётов",
        provides:
          "Блок контекста под полевым отчётом — собственного источника у него нет. Для воздуха и промышленных выбросов цитируется ближайшая станция Open-Meteo/CAMS, для биоразнообразия — запись встречаемости GBIF. И то и другое — строки выше, прочитанные при загрузке страницы и поставленные рядом с отчётом",
        status: "Производный — контекст, а не вердикт; нигде не хранится и пересчитывается в браузере при каждом заходе",
      },
      {
        name: "События сообщества Aetheris",
        provides:
          "Созданные посетителями события с записью и чек-ином по геометке. Координаты чек-ина приходят с устройства самого посетителя и принимаются только в радиусе 500 м от события и внутри его временного окна",
        status: "Live · сообщество — самоорганизация и самоотчёты; Aetheris эти встречи не проводит и не проверяет",
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
        body: "Заметили загрязнение, замор, незаконный сброс? Отправьте геометку-отчёт — он сразу сохраняется и становится публичным. Никакой очереди проверки за ним нет, и никто его не проверяет; дальше рядом с ним может появиться живой замер или отчёт другого человека о том же самом.",
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
        title: "Тәуелсіздік",
        body: "Aetheris — тәуелсіз студенттік жоба. Ол Қазгидрометпен немесе кез келген мемлекеттік органмен аффилиирленбеген, олармен мақұлданбаған және серіктестікте жұмыс істемейді, егер тікелей өзгеше көрсетілмесе. Сайтта, соның ішінде қауымдастықтың далалық есептерінде аталған ведомстволар, кәсіпорындар және мониторинг қызметтері — ашық экологиялық деректердің нысаны ретінде аталған, серіктес, мақұлдау көзі немесе мұнда жарияланғанның рецензенті ретінде емес.",
      },
      {
        title: "Су, биоалуантүрлілік және өнеркәсіп",
        body: "Су сапасы (WQI) және өнеркәсіп жүктемесі (IEI) индекстері детерминирленген өңірлік базадан модельденеді — олар үшін тегін нақты уақыт ағыны әлі жоқ, сондықтан оларды өлшенген емес, бағдарлы деп есептеңіз. Биоалуантүрлілік енді екіге бөлінді: картадағы және қала беттеріндегі сақталу индексі (BII) сол модельдік база күйінде қалады, ал қасында GBIF-тен тірі түрлер кездесуінің сигналы пайда болды — әр қаладан 50 км радиуста соңғы 10 жылда жарияланған түрлер мен бақылау жазбаларының саны. Тірі сигнал экологияны ғана емес, бақылау белсенділігін де көрсетеді және BII-ге кірмейді: екеуі қатар шығып, бөлек таңбаланады. Өнеркәсіптік жүктеме үшін әзірге қосылмаған үміткер дереккөз бар: Copernicus Sentinel-5P / TROPOMI жерсерігінің NO₂ және SO₂ бағаналық концентрациялары — олар өнеркәсіптік шығарынды шлейфтерін бақылайды. Оны пайдалану үшін бір REST-сұрау емес, жерсерік кадрларын өңдеу керек (Google Earth Engine немесе баламасы арқылы), сондықтан IEI әзірге модельдік күйінде қалады. Су сапасы үшін Қазақстан бойынша қажетті егжей-тегжейлі тегін нақты уақыт дереккөзі мүлдем табылған жоқ. Осы олқылықтың қасында аспап та, модель де емес жалғыз көрсеткіш тұр: қала бойынша санаттар мен ауырлық бойынша соңғы 30 күнде жинақталған, «Live · қауымдастық» деп белгіленген қауымдастықтың далалық есептері. Ол нақты әрі өзекті, бірақ өзін-өзі есептеу: ешбір аспаппен тексерілмеген және кім қарайтынына тәуелді — есебі жоқ қала таза қала емес, одан ешкім жазбаған. Ол модельдік WQI-дың қасында тұрады және оған кірмейді. Есептердің бес мәртебесінің бірі болады — олар төмендегі «Қауымдастық есептерінің мәртебелері» бөлімінде толық сипатталған.",
      },
      {
        title: "Қауымдастық есептерінің мәртебелері",
        body: "Есеп бес мәртебеден тұратын бекітілген сөздік бойынша жүреді, ал онда жоқ нәрсе әдейі жоқ. ① «Отправлен» — әдепкі мәртебе және есептің өзі туралы айтатынының бәрі: сақталған, ешкім оқымаған. ② «AI-контекст добавлен» дегені — Aetheris Analyst оның қасына тірі өлшем қойды: ауа мен өнеркәсіптік шығарындылар үшін ең жақын Open-Meteo/CAMS станциясы, биоалуантүрлілік үшін GBIF кездесу жазбасы. Бұл контекст қала беттері пайдаланатын дәл сол ағындардан бет жүктелгенде браузерде есептеледі, сондықтан ол ешқайда сақталмайды және ешбір клиент дерекқорға платформаның атынан тұжырым жаза алмайды; оның үстіне бұл — есеп берілген сәттегі емес, «дәл қазіргі» өлшем, және блок бұл туралы тікелей айтады. Фотосуреттерді жерсерікпен салыстыру жоқ, оны бейнелейтін бос орынбасар да жоқ: ол үшін жобаның қолы жетпейтін ажыратымдылық пен түсіру жиілігі бар коммерциялық мұрағаттар керек. ③ «Corroborated сообществом» — бұрыннан бар ереже: бір қалада бір санат бойынша 72 сағат ішінде екі не одан көп түрлі құрылғы хабарлайды. Бұл адамдардың растауы, верификация емес: екеуі бірдей қателесуі мүмкін және оларды ешбір аспап тексермеген. ④ «Передано в акимат/эко-инспекцию» деректердің мемлекеттік органға берілгенін тіркейді, кім, қашан және қайда бергені ашық журналда сақталады; бұл — есеп тарихындағы оқиға, оны бағалау емес, әрі алушының қалай, тіпті жауап бергені туралы ештеңе айтпайды. ⑤ «Ответ организации» платформада болуға келіскен ұйым пікір қалдырғанда ғана пайда болады — ол сөзбе-сөз және ұйым аты көрсетіліп келтіріледі. ④ мен ⑤-ті тек сервистік кілті бар команда мүшесі қоя алады: оларды жазатын дерекқор функцияларының анонимді келушілер үшін орындау құқығы алынып тасталған, сондықтан ешкім өз есебін мемлекеттік органға берілген деп белгілей алмайды және одан жауап ойлап таба алмайды. «Тексерілді» және «шешілді» мәртебелері жоқ. Aetheris-те модераторлар жоқ, далалық есептің артында аспаптық тексеру жоқ және верификация үшін заңды жауапкершілік жоқ — сондықтан платформа осы үшеуінің бірде-бірін мәлімдейтін сөзді баспайды.",
      },
      {
        title: "Жиынтық тәуекел",
        body: "Экологиялық тәуекел индексі (ERI) қабат индекстерін өңірлік климаттық тәуекел салмақтарымен әр қалаға арналған бірыңғай 0–100 бағаға біріктіреді.",
      },
      {
        title: "Валидация",
        body: "Модельдік мәндер, тірі деректер және қауымдастықтың далалық есептері арасындағы салыстыру ресімделуде. Бұл бөлімде валидация хаттамасы мен белгілі қателік шектері сипатталады. Бүгін бар нәрсе одан тар және онымен шатастырылмауы керек: есептің қасына контекст ретінде қойылған тірі өлшем (② мәртебесі) және тәуелсіз адамдар арасындағы растау (③ мәртебесі). Екеуінің де валидацияға қатысы жоқ.",
      },
      {
        title: "Eco-Points, дәрежелер және бейджтер",
        body: "Қатысушылар Eco-Points жинайды: есеп бергені үшін 10, ол «Corroborated сообществом» дәрежесіне жеткенде 25, тіркелген фото ажыратымдылық пен айқындық тексерісінен өтсе 5, өзінің бұрынғы есебі бойынша жаңарту үшін 15. Механика Eco-Points деп аталады, басқаша емес — бұл токен емес, оларды беруге немесе айырбастауға болмайды, ақшалай құны жоқ және платформада ештеңені ашпайды. Aetheris-те аккаунттар болмағандықтан, олар келушінің өз браузерінде сол браузердің есептері бойынша есептеледі және сайт деректерімен бірге өшеді; екі құрылғыдағы бір адам платформа үшін екі қатысушы, ал клиент жазатын өрістерді (фото сапасының белгісі, бастапқы есепке сілтеме) қатысушының өзі мәлімдейді. Дәреже баспалдағы мұнда бұрыннан қолданылған атауларды кеңейтеді — Новичок, Observer I–III, Field Researcher, Eco-Inspector, Sentinel I–III, Constellation — ал бес географиялық бейдж Алматыны, Арал бассейнін, Теміртау–Қарағанды өнеркәсіп белдеуін, Балқаш бассейнін және Каспий жағалауын қамтиды.",
      },
      {
        title: "Іс-шаралар және чек-ин",
        body: "Кез келген адам қауымдастық іс-шарасын құра алады және басқасына жазыла алады, тәулігіне бір құрылғыдан үш жаңа іс-шара шегімен. Чек-ин — платформадағы адамның бір жерде физикалық болғанын мәлімдейтін жалғыз нәрсе, сондықтан оның ережелері браузерде емес, дерекқорда тексеріледі: іс-шара пинінен 500 м-ден алыс емес және басталуына бір сағат қалғаннан кейін төрт сағат өткенге дейінгі терезеде. Координаттар бәрібір келушінің құрылғысынан келеді, сондықтан бұл кездейсоқ пен ұқыпсызды тоқтатады, әдейі жалғандықты емес. Тікелей аталған екі белгілі шектеу: қатысушылар лимиті жазудан бұрын тексеріледі, бұғаттау арқылы емес, сондықтан екі адам соңғы орынды бір мезгілде ала алады; және анонимді құрылғы идентификаторын дәлелдеу мүмкін болмағандықтан, жазылуды оны білетін кез келген адам алып тастай алады. Екеуі де платформада нағыз аккаунттар пайда болғанда жабылады. Екі жағдайда да есеп деректеріне қол жеткізуге болмайды.",
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
        name: "Есеп карточкаларындағы AI-контекст",
        provides:
          "Далалық есептің астындағы контекст блогы — оның өз дереккөзі жоқ. Ауа мен өнеркәсіптік шығарындылар үшін ең жақын Open-Meteo/CAMS станциясы, биоалуантүрлілік үшін GBIF кездесу жазбасы келтіріледі. Екеуі де — жоғарыдағы жолдар, бет жүктелгенде оқылып, есептің қасына қойылған",
        status: "Туынды — вердикт емес, контекст; ешқайда сақталмайды және әр кіргенде браузерде қайта есептеледі",
      },
      {
        name: "Aetheris қауымдастық іс-шаралары",
        provides:
          "Келушілер құрған іс-шаралар, жазылу және геобелгі бойынша чек-ин. Чек-ин координаттары келушінің өз құрылғысынан келеді және тек іс-шарадан 500 м радиуста әрі оның уақыт терезесінде қабылданады",
        status: "Live · қауымдастық — өзін-өзі ұйымдастыру және өзін-өзі есептеу; Aetheris бұл кездесулерді өткізбейді және тексермейді",
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
        body: "Ластануды, жаппай қырылуды, заңсыз төгіндіні байқадыңыз ба? Геобелгісі бар есеп жіберіңіз — ол бірден сақталып, жария болады. Оның артында тексеру кезегі жоқ, оны ешкім тексермейді; әрі қарай оның қасында тікелей өлшем немесе дәл сол нәрсе туралы басқа адамның есебі пайда болуы мүмкін.",
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
