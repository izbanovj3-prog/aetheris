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
        title: "How we check information",
        body: "Every figure on Aetheris carries a mark, and the marks are not equally reliable. “Live” is a reading fetched from an open data service (Open-Meteo / CAMS), which is itself a model-assisted product and not a state monitoring station. “Modeled” is a simulation: it shows how a layer is built, not what was measured, and must not be cited as a measurement. “Community” is a report from a resident that nobody has checked: it reaches “Совпадает с другими сообщениями” only when at least two different devices describe the same category in the same city within 72 hours, and even then no moderator or instrument has looked at it. Data from state bodies (Kazhydromet, the Ministry of Ecology and Natural Resources, akimats) is not connected yet. For any decision, complaint or legal claim, use the official data of the authorised body and name it as the source. If you find an error, write to us through the Contact page.",
      },
      {
        title: "Air quality",
        body: "City-level AQI follows the US EPA 0–500 scale, derived from PM2.5, PM10 and NO₂ concentrations. Live readings come from the Open-Meteo Air Quality API (CAMS global model) and are merged over the model baseline on each visit; NO₂ is converted from µg/m³ to ppb for display.",
      },
      {
        title: "Independence",
        body: "Aetheris is an independent student project. It is not affiliated with, endorsed by, or operated in partnership with Kazhydromet or any government agency unless explicitly stated. Agencies, operators and monitoring services named anywhere on this site — including in community field reports — are named as subjects of public environmental data, not as partners, sources of endorsement, or reviewers of anything published here.",
      },
      {
        title: "Water, biodiversity & industrial pollution",
        body: "Water Quality (WQI) and Industrial Load (IEI) are modeled from a deterministic regional baseline — no free real-time point feed exists for those layers yet, so treat them as indicative, not measured. Biodiversity is now split: the Biodiversity Intactness Index (BII) shown on the map and city pages is still that same modeled baseline, while a separate species-occurrence signal is live from GBIF — distinct species and occurrence records published within 50 km of each city over the last 10 years. The live signal reflects recording effort as well as ecology and does not feed into BII; the two are displayed side by side and badged separately. Industrial Load has a candidate live source that is not yet integrated: Copernicus Sentinel-5P / TROPOMI column densities for NO₂ and SO₂, which track industrial emission plumes. Adopting it means processing satellite scenes — through Google Earth Engine or equivalent — rather than the single REST call the air-quality and GBIF feeds need, so IEI stays modeled for now. For Water Quality no free real-time source covering Kazakhstan at this granularity has been identified at all. Alongside that gap sits the one signal here that is neither instrument nor model: community field reports, aggregated per city by category and severity over a rolling 30-day window and badged “Live · community”. It is real and current but self-reported, unverified against any instrument, and shaped by who happens to be looking — a city with no reports is a city nobody has reported from, not a clean one. It sits beside the modeled WQI and never feeds into it. Reports carry one of five statuses, described in full under “Community report statuses” below.",
      },
      {
        title: "Community report statuses",
        body: "A field report moves through a fixed vocabulary of five, and what is missing from it is deliberate. ① “Отправлен” (Submitted) is the default and everything a submission ever claims about itself: filed and stored, read by nobody. ② “AI-контекст добавлен” (AI context attached) means Aetheris Analyst put a live reading beside it — the nearest Open-Meteo/CAMS air-quality station for air and industrial reports, or the GBIF occurrence record for biodiversity ones. That context is computed in the browser at page load from the same feeds the city pages use, so it is never stored and no client can write the platform's own framing into the database; it is also a reading from now rather than from when the report was filed, which the bubble says on its face. There is no satellite cross-check of photographs and no placeholder pretending there is: that would need commercial imagery archives at a resolution and revisit rate this project has no access to. ③ “Совпадает с другими сообщениями” (Corroborated by the community) is the existing rule — two or more different devices reporting the same category in the same city within 72 hours. That is corroboration between people, not verification: two reporters can be wrong together, and no instrument has checked either. ④ “Передано в акимат/эко-инспекцию” (Forwarded) records that data was handed to a public body, with who sent it, when and where kept in a publicly readable log; it is an event in the report's history, not an assessment of it, and it says nothing about how or whether the recipient responded. ⑤ “Ответ организации” (Organisation response) appears only when an organisation that has agreed to appear on this platform leaves a comment, quoted as sent and attributed by name. ④ and ⑤ can only be set by a team member holding the service key — the database functions behind them have execute revoked from anonymous visitors, so nobody can mark their own report as forwarded to a government body or invent a reply from one. There is no “verified” status and no “resolved” status. Aetheris has no moderators, no instrument check standing behind a field report and no legal responsibility for verification, so it does not print a word that claims any of the three.",
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
        body: "Contributors accumulate Eco-Points: 10 for filing a report, 25 when it reaches “Совпадает с другими сообщениями”, 5 when the attached photo clears a resolution and sharpness check, and 15 for a follow-up update on one of your own earlier reports. Points are called Eco-Points and nothing else — they are not tokens, cannot be transferred or redeemed, carry no monetary value, and gate nothing on the platform. Because Aetheris has no accounts, they are computed in the visitor's own browser from that browser's own reports and are cleared with site data; one person on two devices counts as two contributors, and the inputs a client writes (the photo-quality flag, the follow-up link) are self-declared. The rank ladder extends the names already used here — Newcomer (written «Новичок» in the concept), Observer I–III, Field Researcher, Eco-Inspector, Sentinel I–III, Constellation — and the five geographic badges cover Almaty, the Aral basin, the Temirtau–Karaganda industrial belt, the Balkhash basin and the Caspian shore.",
      },
      {
        title: "Events and check-in",
        body: "Anyone can create a community event and RSVP to one, capped at three new events per device per day. Check-in is the only thing on the platform that asserts someone was physically in a place, so its rules are enforced in the database rather than in the browser: within 500 m of the event's pin, and from an hour before the start until four hours after it. Coordinates still come from the visitor's own device, so this stops the accidental and the casual case, not a deliberate forgery. The position is used once to compute the distance and is not stored. Participant caps are enforced in the database, and an RSVP can be withdrawn only from the device that made it. The known limit, stated rather than hidden: that device id lives in the browser, so clearing site data loses it — and with it the ability to withdraw an RSVP or delete one's own reports from that device.",
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
        provides: "US AQI, PM2.5, PM10, NO₂ for all 28 cities — output of the CAMS global model, not ground-station measurements",
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
          "The context bubble under a field report — no new source of its own. Air and industrial reports quote the open-data value (CAMS model, not a station) for the nearest city; biodiversity reports quote the GBIF occurrence record for the area. Both are the rows above, read at page load and placed beside the report",
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
        name: "Aetheris city list",
        provides:
          "Headline figures — open-data values per day (cities × metrics × hourly upstream updates), and city, region and hotspot counts",
        status: "Computed from the city list at build time",
      },
    ],
  },
  sensorNetwork: {
    metaTitle: "Coverage",
    metaDescription:
      "Which cities and places Aetheris covers across Kazakhstan, and how often each kind of figure is refreshed. Aetheris runs no sensors of its own.",
    title: "Coverage",
    lede: "Aetheris operates no sensors. Air quality and weather come from Open-Meteo (the CAMS model and a weather forecast) and refresh on every visit; water, industrial pollution, biodiversity and risk are modelled and change with each build; residents' reports are shown separately.",
    facts: [
      { value: "28", label: "Cities covered — every oblast represented" },
      { value: "17", label: "Regions covered" },
      { value: "14", label: "Named environmental hotspots on the map, from the Aral Sea to the Semipalatinsk Polygon — their severities are modelled" },
      { value: "5", label: "Layers per city: air, industrial pollution, water, biodiversity, risk" },
    ],
    citiesTitle: "Cities covered",
    citiesLede: "Every city links to its profile — air quality from open data with pollutant breakdown and health guidance, plus the modelled layers, each marked.",
    inPrep: "Aetheris has no instruments of its own. If that changes, a per-instrument inventory will be published here.",
  },
  mission: {
    metaTitle: "Mission",
    metaDescription:
      "Why Aetheris exists: making Kazakhstan's environment legible to the people who live in it.",
    title: "Mission",
    lede: "The operating system for Kazakhstan's environment.",
    paragraphs: [
      "Kazakhstan carries some of the world's most consequential environmental stories — the Aral Sea, the Semipalatinsk Polygon, industrial corridors like Temirtau and Ekibastuz — yet the data describing them has lived scattered across agencies, formats and paywalls. Aetheris exists to close that gap: one living model of the country's air, water, industrial pollution and biodiversity that anyone can open.",
      "We build for three audiences at once. Scientists get traceable indices and honest uncertainty. Cities get a shared picture of where problems may be, marked as modelled where it is. Citizens get a map that tells them plainly what open data says about the air today — and a way to report what they see.",
      "Everything we publish aims to be verifiable: measured where a source exists, clearly labeled as modeled where one doesn't yet.",
      "Scope. We do not try to describe the whole country. Detailed work — the map view, resident reports and comparison with official data — starts with Almaty and its surroundings. For other cities we show only open air-quality data and modeled values, each with its mark.",
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
      "Aetheris is an independent student project that puts Kazakhstan's environment on one map: air quality from open data (Open-Meteo / CAMS), and clearly marked modelled estimates for water, industrial pollution, biodiversity and ecological risk.",
    nameNote:
      "The name is written AETHERIS (all caps) or Aetheris in running text. Aetheris is an independent student project, not a company.",
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
        body: "Seen a pollution event, a die-off, an illegal discharge? File a geo-tagged report — it's stored and visible immediately. Reports are corroborated between independent contributors over time, not verified by a moderator or instrument — see [Methodology](/methodology) for exactly how that works.",
        actionLabel: "Open the community hub",
        href: "/community",
      },
      {
        title: "Platform & data questions",
        body: "The AI analyst answers from the Aetheris model — a simulated baseline for every layer — and says so in every answer; it is not a source of measurements. For how the figures are built, see [Methodology](/methodology).",
        actionLabel: "Ask the analyst",
        href: "/assistant",
      },
      {
        title: "Press & partnerships",
        body: "For press or partnership inquiries, email [izbanovj3@gmail.com](mailto:izbanovj3@gmail.com) directly — it reaches the team. The press kit has the boilerplate, logo and palette if you need them first.",
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
        title: "Как мы проверяем информацию",
        body: "Каждая цифра на Aetheris имеет пометку, и пометки неравнозначны по надёжности. «Live» — показание, полученное из открытого сервиса данных (Open-Meteo / CAMS), который сам является модельным продуктом, а не государственной станцией мониторинга. «Модель» — симуляция: она показывает, как устроен слой, а не что измерено, и ссылаться на неё как на измерение нельзя. «Сообщество» — сообщение жителя, которое никто не проверял: статус «Совпадает с другими сообщениями» оно получает только если как минимум два разных устройства описали одну категорию в одном городе за 72 часа, и даже тогда его не смотрел ни модератор, ни прибор. Данные государственных органов (Казгидромет, Министерство экологии и природных ресурсов, акиматы) пока не подключены. Для любого решения, обращения или юридической позиции используйте официальные данные уполномоченного органа и называйте его источником. Нашли ошибку — напишите нам через страницу «Контакты».",
      },
      {
        title: "Качество воздуха",
        body: "Городской AQI считается по шкале US EPA 0–500 на основе концентраций PM2.5, PM10 и NO₂. Живые данные приходят из Open-Meteo Air Quality API (глобальная модель CAMS) и накладываются на модельную базу при каждом заходе; NO₂ переводится из µg/m³ в ppb для отображения.",
      },
      {
        title: "Независимость",
        body: "Aetheris — независимый студенческий проект. Он не аффилирован с Казгидрометом или каким-либо государственным органом, не одобрен ими и не работает с ними в партнёрстве, если прямо не указано иное. Ведомства, предприятия и службы мониторинга, упомянутые где-либо на сайте — в том числе в полевых отчётах сообщества, — названы как объекты открытых экологических данных, а не как партнёры, источники одобрения или рецензенты чего-либо здесь опубликованного.",
      },
      {
        title: "Вода, биоразнообразие и промышленное загрязнение",
        body: "Индексы качества воды (WQI) и промышленной нагрузки (IEI) моделируются из детерминированной региональной базы — бесплатного потока в реальном времени для них пока нет, считайте их ориентировочными, а не измеренными. С биоразнообразием теперь два разных показателя: индекс сохранности (BII) на карте и страницах городов остаётся модельным, а рядом появился живой сигнал встречаемости видов из GBIF — число видов и записей наблюдений в радиусе 50 км за последние 10 лет. Живой сигнал отражает и интенсивность наблюдений, а не только состояние окружающей среды, и в BII не входит: показатели выводятся рядом и маркируются отдельно. У промышленной нагрузки есть кандидат на живой источник, пока не подключённый: колоночные концентрации NO₂ и SO₂ со спутника Copernicus Sentinel-5P / TROPOMI — они отслеживают шлейфы промышленных выбросов. Чтобы их использовать, нужна обработка спутниковых сцен (через Google Earth Engine или аналог), а не один REST-запрос, как у воздуха и GBIF, поэтому IEI пока остаётся модельным. Для качества воды бесплатного источника реального времени с нужной детализацией по Казахстану не найдено вовсе. Рядом с этим пробелом стоит единственный показатель, который не является ни прибором, ни моделью: полевые отчёты сообщества, сведённые по городу в разрезе категорий и тяжести за скользящие 30 дней и помеченные «Live · сообщество». Он реален и актуален, но это самоотчёты, не сверенные ни с одним прибором и зависящие от того, кто смотрит: город без отчётов — это город, откуда никто не написал, а не чистый город. Он стоит рядом с модельным WQI и в него не входит. У отчётов есть один из пяти статусов — они полностью описаны ниже, в разделе «Статусы отчётов сообщества».",
      },
      {
        title: "Статусы отчётов сообщества",
        body: "Отчёт движется по фиксированному словарю из пяти статусов, и то, чего в нём нет, отсутствует намеренно. ① «Отправлен» — статус по умолчанию и всё, что отчёт о себе утверждает: сохранён, никем не прочитан. ② «AI-контекст добавлен» означает, что Aetheris Analyst поставил рядом открытые данные — модельное значение Open-Meteo/CAMS для ближайшего города (не станция) для воздуха и промышленных выбросов или запись встречаемости GBIF для биоразнообразия. Этот контекст считается в браузере при загрузке страницы из тех же потоков, что и страницы городов, поэтому он нигде не хранится и ни один клиент не может записать в базу формулировку от лица платформы; это к тому же замер «сейчас», а не на момент подачи, и сам блок об этом прямо говорит. Спутниковой сверки фотографий нет и заглушки, изображающей её, тоже нет: для неё нужны коммерческие архивы съёмки с разрешением и частотой, к которым у проекта нет доступа. ③ «Совпадает с другими сообщениями» — уже существовавшее правило: два и более разных устройства сообщают об одной категории в одном городе в пределах 72 часов. Это подтверждение людьми, а не верификация: двое могут ошибаться одинаково, и ни один прибор их не проверял. ④ «Передано в акимат/эко-инспекцию» фиксирует, что данные переданы государственному органу, с открытым логом кто, когда и куда передал; это событие в истории отчёта, а не его оценка, и оно ничего не говорит о том, как и ответил ли получатель. ⑤ «Ответ организации» появляется только тогда, когда организация, согласившаяся присутствовать на платформе, оставила комментарий — он приводится дословно и с указанием её имени. ④ и ⑤ может проставить только участник команды с сервисным ключом: у функций базы, которые их пишут, отозвано право выполнения для анонимных посетителей, поэтому никто не может пометить свой отчёт как переданный в госорган или выдумать ответ от него. Статусов «проверено» и «решено» нет. У Aetheris нет модераторов, нет приборной проверки полевого отчёта и нет юридической ответственности за верификацию — поэтому платформа не печатает слово, которое утверждало бы хоть одно из трёх.",
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
        body: "Участники накапливают Eco-Points: 10 за поданный отчёт, 25 когда он доходит до «Совпадает с другими сообщениями», 5 если приложенное фото проходит проверку разрешения и резкости, и 15 за апдейт по своему же прошлому отчёту. Механика называется Eco-Points и никак иначе — это не токены, их нельзя передать или обменять, они не имеют денежной ценности и ничего на платформе не открывают. Поскольку у Aetheris нет аккаунтов, они считаются в браузере самого посетителя по отчётам этого же браузера и стираются вместе с данными сайта; один человек с двух устройств для платформы — два участника, а поля, которые пишет клиент (флаг качества фото, ссылка на исходный отчёт), заявляются им самим. Лестница рангов расширяет уже использовавшиеся здесь названия — Новичок, Observer I–III, Field Researcher, Eco-Inspector, Sentinel I–III, Constellation, — а пять географических бейджей покрывают Алматы, Аральский бассейн, промышленный пояс Темиртау–Караганда, бассейн Балхаша и Каспийское побережье.",
      },
      {
        title: "События и чек-ин",
        body: "Любой может создать событие сообщества и записаться на чужое, с лимитом в три новых события на устройство в сутки. Чек-ин — единственное на платформе, что утверждает физическое присутствие человека в месте, поэтому его правила проверяются в базе, а не в браузере: не дальше 500 м от пина события и в окне от часа до начала до четырёх часов после. Координаты всё равно приходят с устройства посетителя, так что это отсекает случайное и небрежное, но не намеренную подделку. Координаты используются один раз, чтобы вычислить расстояние, и не сохраняются. Лимит участников проверяется в базе, а снять запись на событие можно только с того устройства, с которого она сделана. Известное ограничение, названное прямо: идентификатор устройства хранится в браузере, и при очистке данных сайта он теряется — вместе с возможностью снять запись или удалить свои сообщения с этого устройства.",
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
        provides: "US AQI, PM2.5, PM10, NO₂ для всех 28 городов — результат глобальной модели CAMS, а не измерения наземных станций",
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
          "Блок контекста под полевым отчётом — собственного источника у него нет. Для воздуха и промышленных выбросов цитируется модельное значение Open-Meteo/CAMS для ближайшего города (не станция), для биоразнообразия — запись встречаемости GBIF. И то и другое — строки выше, прочитанные при загрузке страницы и поставленные рядом с отчётом",
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
        name: "Список городов Aetheris",
        provides:
          "Ключевые цифры — значений открытых данных в сутки (города × метрики × почасовые обновления у источника), число городов, регионов и горячих точек",
        status: "Вычисляется из списка городов при сборке",
      },
    ],
  },
  sensorNetwork: {
    metaTitle: "Охват",
    metaDescription:
      "Какие города и места Казахстана охватывает Aetheris и как часто обновляется каждый вид данных. Собственных датчиков у Aetheris нет.",
    title: "Охват",
    lede: "У Aetheris нет собственных датчиков. Качество воздуха и погода берутся из Open-Meteo (модель CAMS и прогноз погоды) и обновляются при каждом заходе; вода, промышленное загрязнение, биоразнообразие и риск — модельные и меняются с каждой сборкой; сообщения жителей показываются отдельно.",
    facts: [
      { value: "28", label: "Городов охвачено — представлена каждая область" },
      { value: "17", label: "Регионов покрыто" },
      { value: "14", label: "Именованных экологических горячих точек на карте — от Аральского моря до Семипалатинского полигона; их оценки модельные" },
      { value: "5", label: "Слоёв на город: воздух, промышленное загрязнение, вода, биоразнообразие, риск" },
    ],
    citiesTitle: "Охваченные города",
    citiesLede: "Каждый город ведёт на свой профиль — качество воздуха по открытым данным с разбивкой по загрязнителям и рекомендациями для здоровья, плюс модельные слои, каждый с пометкой.",
    inPrep: "Собственных приборов у Aetheris нет. Если они появятся, здесь будет опубликован их перечень.",
  },
  mission: {
    metaTitle: "Миссия",
    metaDescription:
      "Зачем существует Aetheris: сделать состояние окружающей среды Казахстана понятным тем, кто в нём живёт.",
    title: "Миссия",
    lede: "Операционная система для окружающей среды Казахстана.",
    paragraphs: [
      "Казахстан хранит одни из самых значимых экологических историй в мире — Аральское море, Семипалатинский полигон, промышленные коридоры вроде Темиртау и Экибастуза — но данные о них жили разрозненно: по разным ведомствам, форматам и платным доступам. Aetheris существует, чтобы закрыть этот разрыв: одна живая модель воздуха, воды, промышленного загрязнения и биоразнообразия страны, которую может открыть каждый.",
      "Мы строим сразу для трёх аудиторий. Учёные получают прослеживаемые индексы и честную неопределённость. Города — общую картину того, где могут быть проблемы, с пометкой «модель» там, где это модель. Граждане — карту, которая прямо говорит, что открытые данные показывают о воздухе сегодня, и способ сообщить о том, что они видят.",
      "Всё, что мы публикуем, стремится быть проверяемым: измерено там, где источник есть, и явно помечено как модельное там, где источника пока нет.",
      "Охват. Мы не берёмся описывать всю страну сразу. Подробную работу — карту, сообщения жителей и сопоставление с официальными данными — начинаем с Алматы и её окрестностей. По остальным городам показываем только открытые данные о качестве воздуха и модельные значения, каждое со своей пометкой.",
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
      "Aetheris — независимый студенческий проект, который собирает состояние окружающей среды Казахстана на одной карте: качество воздуха по открытым данным (Open-Meteo / CAMS) и явно помеченные модельные оценки воды, промышленного загрязнения, биоразнообразия и экологического риска.",
    nameNote:
      "Название пишется AETHERIS (заглавными) или Aetheris в тексте. Aetheris — независимый студенческий проект, а не компания.",
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
        body: "Заметили загрязнение, замор, незаконный сброс? Отправьте геометку-отчёт — он сохраняется и виден сразу. Отчёты со временем подтверждаются независимыми участниками, а не проверяются модератором или прибором — как именно это работает, описано в разделе [«Методология»](/methodology).",
        actionLabel: "Открыть хаб сообщества",
        href: "/community",
      },
      {
        title: "Вопросы о платформе и данных",
        body: "ИИ-аналитик отвечает по модели Aetheris — симулированной базе для каждого слоя — и прямо говорит об этом в каждом ответе; это не источник измерений. Как устроены цифры — в [методологии](/methodology).",
        actionLabel: "Спросить аналитика",
        href: "/assistant",
      },
      {
        title: "Пресса и партнёрства",
        body: "По вопросам прессы и партнёрства пишите напрямую на [izbanovj3@gmail.com](mailto:izbanovj3@gmail.com) — письмо дойдёт до команды. В пресс-ките есть официальный текст, логотип и палитра, если они нужны заранее.",
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
        title: "Ақпаратты қалай тексереміз",
        body: "Aetheris-тегі әр сан белгімен беріледі, ал белгілердің сенімділігі бірдей емес. «Live» — ашық дерек қызметінен (Open-Meteo / CAMS) алынған көрсеткіш; бұл қызметтің өзі мемлекеттік мониторинг бекеті емес, модельдік өнім. «Модель» — симуляция: ол қабаттың қалай құрылғанын көрсетеді, нені өлшегенін емес, сондықтан оған өлшем ретінде сілтеме жасауға болмайды. «Қауымдастық» — ешкім тексермеген тұрғынның хабарламасы: ол «Совпадает с другими сообщениями» мәртебесін бір қалада бір санат бойынша 72 сағат ішінде кемінде екі түрлі құрылғы хабарлағанда ғана алады, сонда да оны модератор да, аспап та қараған жоқ. Мемлекеттік органдардың деректері (Қазгидромет, Экология және табиғи ресурстар министрлігі, әкімдіктер) әзірге қосылмаған. Кез келген шешім, өтініш немесе заңды позиция үшін уәкілетті органның ресми деректерін пайдаланып, оны дереккөз ретінде атаңыз. Қате тапсаңыз, «Байланыс» бетінен жазыңыз.",
      },
      {
        title: "Ауа сапасы",
        body: "Қалалық AQI PM2.5, PM10 және NO₂ концентрацияларынан алынған US EPA 0–500 шкаласымен есептеледі. Тірі деректер Open-Meteo Air Quality API-ден (жаһандық CAMS моделі) келеді және әр кіргенде модельдік базаның үстіне жинақталады; NO₂ көрсету үшін µg/m³-тен ppb-ге аударылады.",
      },
      {
        title: "Тәуелсіздік",
        body: "Aetheris — тәуелсіз студенттік жоба. Ол Қазгидрометпен немесе кез келген мемлекеттік органмен аффилиирленбеген, олармен мақұлданбаған және серіктестікте жұмыс істемейді, егер тікелей өзгеше көрсетілмесе. Сайтта, соның ішінде қауымдастықтың далалық есептерінде аталған ведомстволар, кәсіпорындар және мониторинг қызметтері — ашық экологиялық деректердің нысаны ретінде аталған, серіктес, мақұлдау көзі немесе мұнда жарияланғанның рецензенті ретінде емес.",
      },
      {
        title: "Су, биоалуантүрлілік және өнеркәсіптік ластану",
        body: "Су сапасы (WQI) және өнеркәсіп жүктемесі (IEI) индекстері детерминирленген өңірлік базадан модельденеді — олар үшін тегін нақты уақыт ағыны әлі жоқ, сондықтан оларды өлшенген емес, бағдарлы деп есептеңіз. Биоалуантүрлілік енді екіге бөлінді: картадағы және қала беттеріндегі сақталу индексі (BII) сол модельдік база күйінде қалады, ал қасында GBIF-тен тірі түрлер кездесуінің сигналы пайда болды — әр қаладан 50 км радиуста соңғы 10 жылда жарияланған түрлер мен бақылау жазбаларының саны. Тірі сигнал экологияны ғана емес, бақылау белсенділігін де көрсетеді және BII-ге кірмейді: екеуі қатар шығып, бөлек таңбаланады. Өнеркәсіптік жүктеме үшін әзірге қосылмаған үміткер дереккөз бар: Copernicus Sentinel-5P / TROPOMI жерсерігінің NO₂ және SO₂ бағаналық концентрациялары — олар өнеркәсіптік шығарынды шлейфтерін бақылайды. Оны пайдалану үшін бір REST-сұрау емес, жерсерік кадрларын өңдеу керек (Google Earth Engine немесе баламасы арқылы), сондықтан IEI әзірге модельдік күйінде қалады. Су сапасы үшін Қазақстан бойынша қажетті егжей-тегжейлі тегін нақты уақыт дереккөзі мүлдем табылған жоқ. Осы олқылықтың қасында аспап та, модель де емес жалғыз көрсеткіш тұр: қала бойынша санаттар мен ауырлық бойынша соңғы 30 күнде жинақталған, «Live · қауымдастық» деп белгіленген қауымдастықтың далалық есептері. Ол нақты әрі өзекті, бірақ өзін-өзі есептеу: ешбір аспаппен тексерілмеген және кім қарайтынына тәуелді — есебі жоқ қала таза қала емес, одан ешкім жазбаған. Ол модельдік WQI-дың қасында тұрады және оған кірмейді. Есептердің бес мәртебесінің бірі болады — олар төмендегі «Қауымдастық есептерінің мәртебелері» бөлімінде толық сипатталған.",
      },
      {
        title: "Қауымдастық есептерінің мәртебелері",
        body: "Есеп бес мәртебеден тұратын бекітілген сөздік бойынша жүреді, ал онда жоқ нәрсе әдейі жоқ. ① «Отправлен» — әдепкі мәртебе және есептің өзі туралы айтатынының бәрі: сақталған, ешкім оқымаған. ② «AI-контекст добавлен» дегені — Aetheris Analyst оның қасына тірі өлшем қойды: ауа мен өнеркәсіптік шығарындылар үшін ең жақын қала үшін Open-Meteo/CAMS модельдік мәні (станция емес), биоалуантүрлілік үшін GBIF кездесу жазбасы. Бұл контекст қала беттері пайдаланатын дәл сол ағындардан бет жүктелгенде браузерде есептеледі, сондықтан ол ешқайда сақталмайды және ешбір клиент дерекқорға платформаның атынан тұжырым жаза алмайды; оның үстіне бұл — есеп берілген сәттегі емес, «дәл қазіргі» өлшем, және блок бұл туралы тікелей айтады. Фотосуреттерді жерсерікпен салыстыру жоқ, оны бейнелейтін бос орынбасар да жоқ: ол үшін жобаның қолы жетпейтін ажыратымдылық пен түсіру жиілігі бар коммерциялық мұрағаттар керек. ③ «Совпадает с другими сообщениями» — бұрыннан бар ереже: бір қалада бір санат бойынша 72 сағат ішінде екі не одан көп түрлі құрылғы хабарлайды. Бұл адамдардың растауы, верификация емес: екеуі бірдей қателесуі мүмкін және оларды ешбір аспап тексермеген. ④ «Передано в акимат/эко-инспекцию» деректердің мемлекеттік органға берілгенін тіркейді, кім, қашан және қайда бергені ашық журналда сақталады; бұл — есеп тарихындағы оқиға, оны бағалау емес, әрі алушының қалай, тіпті жауап бергені туралы ештеңе айтпайды. ⑤ «Ответ организации» платформада болуға келіскен ұйым пікір қалдырғанда ғана пайда болады — ол сөзбе-сөз және ұйым аты көрсетіліп келтіріледі. ④ мен ⑤-ті тек сервистік кілті бар команда мүшесі қоя алады: оларды жазатын дерекқор функцияларының анонимді келушілер үшін орындау құқығы алынып тасталған, сондықтан ешкім өз есебін мемлекеттік органға берілген деп белгілей алмайды және одан жауап ойлап таба алмайды. «Тексерілді» және «шешілді» мәртебелері жоқ. Aetheris-те модераторлар жоқ, далалық есептің артында аспаптық тексеру жоқ және верификация үшін заңды жауапкершілік жоқ — сондықтан платформа осы үшеуінің бірде-бірін мәлімдейтін сөзді баспайды.",
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
        body: "Қатысушылар Eco-Points жинайды: есеп бергені үшін 10, ол «Совпадает с другими сообщениями» дәрежесіне жеткенде 25, тіркелген фото ажыратымдылық пен айқындық тексерісінен өтсе 5, өзінің бұрынғы есебі бойынша жаңарту үшін 15. Механика Eco-Points деп аталады, басқаша емес — бұл токен емес, оларды беруге немесе айырбастауға болмайды, ақшалай құны жоқ және платформада ештеңені ашпайды. Aetheris-те аккаунттар болмағандықтан, олар келушінің өз браузерінде сол браузердің есептері бойынша есептеледі және сайт деректерімен бірге өшеді; екі құрылғыдағы бір адам платформа үшін екі қатысушы, ал клиент жазатын өрістерді (фото сапасының белгісі, бастапқы есепке сілтеме) қатысушының өзі мәлімдейді. Дәреже баспалдағы мұнда бұрыннан қолданылған атауларды кеңейтеді — Новичок, Observer I–III, Field Researcher, Eco-Inspector, Sentinel I–III, Constellation — ал бес географиялық бейдж Алматыны, Арал бассейнін, Теміртау–Қарағанды өнеркәсіп белдеуін, Балқаш бассейнін және Каспий жағалауын қамтиды.",
      },
      {
        title: "Іс-шаралар және чек-ин",
        body: "Кез келген адам қауымдастық іс-шарасын құра алады және басқасына жазыла алады, тәулігіне бір құрылғыдан үш жаңа іс-шара шегімен. Чек-ин — платформадағы адамның бір жерде физикалық болғанын мәлімдейтін жалғыз нәрсе, сондықтан оның ережелері браузерде емес, дерекқорда тексеріледі: іс-шара пинінен 500 м-ден алыс емес және басталуына бір сағат қалғаннан кейін төрт сағат өткенге дейінгі терезеде. Координаттар бәрібір келушінің құрылғысынан келеді, сондықтан бұл кездейсоқ пен ұқыпсызды тоқтатады, әдейі жалғандықты емес. Координаттар қашықтықты есептеу үшін бір рет қолданылады және сақталмайды. Қатысушылар лимиті дерекқорда тексеріледі, ал жазылуды тек ол жасалған құрылғыдан ғана алып тастауға болады. Тікелей аталған белгілі шектеу: құрылғы идентификаторы браузерде сақталады, сайт деректерін тазалағанда ол жоғалады — сонымен бірге сол құрылғыдан жазылуды алып тастау немесе өз есептерін жою мүмкіндігі де жоғалады.",
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
        provides: "Барлық 28 қала үшін US AQI, PM2.5, PM10, NO₂ — жер үсті станцияларының өлшеуі емес, жаһандық CAMS моделінің нәтижесі",
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
          "Далалық есептің астындағы контекст блогы — оның өз дереккөзі жоқ. Ауа мен өнеркәсіптік шығарындылар үшін ең жақын қала үшін Open-Meteo/CAMS модельдік мәні (станция емес), биоалуантүрлілік үшін GBIF кездесу жазбасы келтіріледі. Екеуі де — жоғарыдағы жолдар, бет жүктелгенде оқылып, есептің қасына қойылған",
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
        name: "Aetheris қалалар тізімі",
        provides:
          "Негізгі көрсеткіштер — тәулігіне ашық дерек мәндері (қалалар × метрикалар × дереккөздегі сағаттық жаңартулар), қала, өңір және ошақ саны",
        status: "Құрастыру кезінде қалалар тізімінен есептеледі",
      },
    ],
  },
  sensorNetwork: {
    metaTitle: "Қамту",
    metaDescription:
      "Aetheris Қазақстанның қай қалалары мен жерлерін қамтиды және әр дерек түрі қаншалықты жиі жаңарады. Aetheris-тің өз сенсорлары жоқ.",
    title: "Қамту",
    lede: "Aetheris-тің өз сенсорлары жоқ. Ауа сапасы мен ауа райы Open-Meteo-дан (CAMS моделі және ауа райы болжамы) алынады және әр кіргенде жаңарады; су, өнеркәсіптік ластану, биоалуантүрлілік және тәуекел — модельдік, әр құрастыруда өзгереді; тұрғындар хабарламалары бөлек көрсетіледі.",
    facts: [
      { value: "28", label: "Қамтылған қалалар — әр облыс ұсынылған" },
      { value: "17", label: "Қамтылған өңірлер" },
      { value: "14", label: "Картадағы аталған экологиялық ошақтар — Арал теңізінен Семей полигонына дейін; олардың бағалары модельдік" },
      { value: "5", label: "Қалаға шаққандағы қабаттар: ауа, өнеркәсіптік ластану, су, биоалуантүрлілік, тәуекел" },
    ],
    citiesTitle: "Қамтылған қалалар",
    citiesLede: "Әр қала өз профиліне бағыттайды — ашық деректер бойынша ауа сапасы, ластағыштар бөлінісі және денсаулық ұсыныстары, қоса әрқайсысы белгіленген модельдік қабаттар.",
    inPrep: "Aetheris-тің өз аспаптары жоқ. Олар пайда болса, тізімі осында жарияланады.",
  },
  mission: {
    metaTitle: "Миссия",
    metaDescription:
      "Aetheris не үшін бар: Қазақстанның экологиялық жағдайын онда тұратындарға түсінікті ету.",
    title: "Миссия",
    lede: "Қазақстанның қоршаған ортасына арналған операциялық жүйе.",
    paragraphs: [
      "Қазақстан әлемдегі ең маңызды экологиялық оқиғалардың бірін сақтайды — Арал теңізі, Семей полигоны, Теміртау мен Екібастұз секілді өнеркәсіп дәліздері — бірақ ол туралы деректер ведомстволар, форматтар мен ақылы қолжетімділік арасында шашырап жатты. Aetheris осы алшақтықты жою үшін бар: елдің ауасының, суының, өнеркәсіптік ластануы мен биоалуантүрлілігінің кез келген адам аша алатын бір тірі моделі.",
      "Біз бірден үш аудиторияға құрамыз. Ғалымдар бақыланатын индекстер мен адал белгісіздік алады. Қалалар — проблемалар қай жерде болуы мүмкін екенінің ортақ көрінісін, модель болған жерде «модель» белгісімен. Азаматтар — ашық деректердің бүгінгі ауа туралы не көрсететінін анық айтатын картаны және көргенін хабарлау мүмкіндігін.",
      "Біз жариялайтын барлық нәрсе тексерілетін болуға тырысады: дереккөз бар жерде өлшенген, әлі жоқ жерде анық модельдік деп белгіленген.",
      "Қамту. Біз бүкіл елді бірден сипаттауға тырыспаймыз. Егжей-тегжейлі жұмысты — картаны, тұрғындардың хабарламаларын және ресми деректермен салыстыруды — Алматы мен оның төңірегінен бастаймыз. Қалған қалалар бойынша тек ауа сапасының ашық деректерін және модельдік мәндерді көрсетеміз, әрқайсысы өз белгісімен.",
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
      "Aetheris — Қазақстанның қоршаған ортасын бір картаға жинайтын тәуелсіз студенттік жоба: ашық деректер бойынша ауа сапасы (Open-Meteo / CAMS) және су, өнеркәсіптік ластану, биоалуантүрлілік пен экологиялық тәуекелдің анық белгіленген модельдік бағалаулары.",
    nameNote:
      "Атауы AETHERIS (бас әріппен) немесе мәтінде Aetheris деп жазылады. Aetheris — компания емес, тәуелсіз студенттік жоба.",
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
        body: "Ластануды, жаппай қырылуды, заңсыз төгіндіні байқадыңыз ба? Геобелгісі бар есеп жіберіңіз — ол сақталып, бірден көрінеді. Есептер уақыт өте тәуелсіз қатысушылармен расталады, оларды модератор да, аспап та тексермейді — бұл қалай жұмыс істейтіні [«Әдіснама»](/methodology) бөлімінде сипатталған.",
        actionLabel: "Қауымдастық хабын ашу",
        href: "/community",
      },
      {
        title: "Платформа мен деректер сұрақтары",
        body: "ЖИ-аналитик Aetheris моделі бойынша — әр қабатқа арналған симуляцияланған база бойынша — жауап береді және мұны әр жауапта ашық айтады; бұл өлшеулер көзі емес. Сандар қалай құрылатыны — [әдістемеде](/methodology).",
        actionLabel: "Аналитиктен сұрау",
        href: "/assistant",
      },
      {
        title: "Баспасөз және серіктестік",
        body: "Баспасөз және серіктестік сұрақтары бойынша тікелей [izbanovj3@gmail.com](mailto:izbanovj3@gmail.com) мекенжайына жазыңыз — хат командаға жетеді. Баспасөз жинағында ресми мәтін, логотип және палитра бар, егер олар алдын ала қажет болса.",
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
