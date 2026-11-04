/* ─────────────────────────────────────────────────────────────
   AETHERIS · Privacy policy and terms of use — DRAFTS

   Both documents are drafts written by the development team, not by a
   lawyer, and every page that renders them says so. They describe what
   the code actually does (supabase/privacy-hardening.sql, lib/reports.ts,
   lib/events.ts); when the code changes, these change with it.

   Where a decision belongs to a lawyer or to the owner — who the legal
   operator is, where the database is hosted, how long reports are kept —
   the text says it is not settled rather than inventing an answer. The
   open questions are listed in docs/legal-review.md.

   Links use the [label](href) form expanded by components/pages/LegalPage.
   ───────────────────────────────────────────────────────────── */

import type { Locale } from "./i18n";

export interface LegalSection {
  heading: string;
  /** Paragraphs. A paragraph starting with "• " renders as a list item. */
  body: string[];
}

export interface LegalDoc {
  metaTitle: string;
  metaDescription: string;
  kicker: string;
  title: string;
  draftBanner: string;
  updated: string;
  sections: LegalSection[];
}

export interface LegalContent {
  privacy: LegalDoc;
  terms: LegalDoc;
}

/** Date of the current draft. Bump it with any change of substance. */
export const LEGAL_DRAFT_DATE = "2026-11-03";
const CONTACT = "izbanovj3@gmail.com";

const en: LegalContent = {
  privacy: {
    metaTitle: "Privacy policy (draft)",
    metaDescription:
      "What Aetheris stores when you file a report or join an event, what stays on your device, and how to delete it. Draft under legal review.",
    kicker: "Privacy",
    title: "Privacy policy",
    draftBanner:
      "Draft under legal review. This text was written by the project team to describe what the site actually does; it has not yet been checked by a lawyer and may change.",
    updated: `Draft of ${LEGAL_DRAFT_DATE}`,
    sections: [
      {
        heading: "Who runs Aetheris",
        body: [
          `Aetheris is an independent student project — not a company and not a government body. Questions about this policy or about your data: [${CONTACT}](mailto:${CONTACT}).`,
        ],
      },
      {
        heading: "There are no accounts",
        body: [
          "You do not sign up and we do not ask for your name, e-mail or phone number. To let your browser recognise its own reports, it creates a random device identifier and keeps it in its own storage. That identifier is stored with what you submit, but no visitor can read it, and it is not linked to who you are.",
        ],
      },
      {
        heading: "When you file a report",
        body: [
          "The following is stored in the shared database and shown publicly on the site: category, severity, title, description, city, the time of filing, and the map position rounded to about 1 km. Its status (for example, “matches other reports” or “forwarded”) is public too.",
          "Write only what you saw. Please do not put other people’s names, phone numbers, car plates or home addresses into a report — it is public.",
          "The device identifier is stored with the report but is not public.",
        ],
      },
      {
        heading: "Photos stay on your device",
        body: [
          "A photo you add is not uploaded. It is shrunk and re-encoded in your browser — which also removes the metadata a camera writes into the file, including GPS coordinates — and kept only in this browser’s storage, next to your copy of the report. Nobody else sees it, including us.",
          "It is deleted when you delete the report on this device, or when you clear this site’s data in your browser.",
        ],
      },
      {
        heading: "Your location",
        body: [
          "You place the pin yourself; your device may suggest a position if you allow it. Before the report leaves your device the position is rounded to two decimal places — about 1 km — and the database rounds it again, so the exact point is never stored. Even so, a 1 km square can point to a small settlement or a single street: if that matters to you, move the pin.",
        ],
      },
      {
        heading: "Events, sign-ups and check-ins",
        body: [
          "An event’s title, description, meeting place, its pin and start time are public — the organiser chooses them to be found. Sign-ups and check-ins are stored with the device identifier and shown only as counts.",
          "To check in, your device sends its position once; the database uses it to compute the distance to the event and then discards it. Only the distance is kept.",
        ],
      },
      {
        heading: "Protection against flooding",
        body: [
          "To stop one sender flooding the feed with many device identifiers, the database keeps a one-way hash of the network address a submission came from, made with a random key that is replaced every day and deleted when the day ends. Hashes are deleted after 24 hours. The address itself is never stored.",
        ],
      },
      {
        heading: "What we pass on",
        body: [
          "The team may forward a public report — its text, category, city and rounded position — to a local akimat or environmental inspection; the report then shows status ④ and the body it went to. The device identifier is never forwarded. If an organisation replies and agrees to be named, its reply is shown with the report.",
        ],
      },
      {
        heading: "Stored in your browser",
        body: [
          "• the device identifier;",
          "• your own reports and their photos;",
          "• your text-size and theme choices.",
          "Clearing this site’s data in your browser removes all of it. After that the site can no longer recognise your earlier reports as yours, so you will not be able to delete them yourself — write to us instead.",
        ],
      },
      {
        heading: "Services the site uses",
        body: [
          "• Vercel — hosts the site and counts visits and page speed in aggregate (Vercel Web Analytics and Speed Insights);",
          "• Supabase — the database for reports and events;",
          "• Open-Meteo, GBIF and CARTO — your browser requests air-quality data, species records and map tiles from them directly, so, like any website you load, they receive your network address.",
          "Where the Supabase database is physically hosted, and what that means under the law of Kazakhstan, is part of the legal review.",
        ],
      },
      {
        heading: "How long data is kept",
        body: [
          "A fixed retention period for reports and events has not yet been set; until it is, they stay until you or the team delete them. Network-address hashes are kept for 24 hours. This section will change after legal review.",
        ],
      },
      {
        heading: "Deleting and asking",
        body: [
          "On the [community page](/community), every report filed from this device has a “Delete” button. A report already forwarded to an organisation (status ④ or ⑤) cannot be deleted from the device, because that would also erase the record of the transfer — write to us and we will remove it.",
          `To ask what is stored about a report, or to have one removed when you no longer have the device: [${CONTACT}](mailto:${CONTACT}), with a link to the report.`,
        ],
      },
    ],
  },
  terms: {
    metaTitle: "Terms of use (draft)",
    metaDescription:
      "What Aetheris is and is not, the rules for community reports, and what the team may do with them. Draft under legal review.",
    kicker: "Terms",
    title: "Terms of use",
    draftBanner:
      "Draft under legal review. This text was written by the project team; it has not yet been checked by a lawyer and may change.",
    updated: `Draft of ${LEGAL_DRAFT_DATE}`,
    sections: [
      {
        heading: "What Aetheris is",
        body: [
          "Aetheris is an independent student project about the state of the environment in Kazakhstan. It is not an official monitoring service and does not speak for any government body.",
          "Some figures are live readings from open data services, some are modelled estimates, and some are reports from residents. Each is marked; see the [methodology](/methodology). Modelled values are estimates, not measurements.",
        ],
      },
      {
        heading: "Not for emergencies or safety decisions",
        body: [
          "Do not rely on the site to decide whether something is safe. In an emergency call 112. For official air-quality and pollution data, use the bodies responsible for it.",
        ],
      },
      {
        heading: "Your reports",
        body: [
          "• Describe what you saw yourself, as accurately as you can.",
          "• Do not include other people’s personal data — names, phone numbers, car plates, private addresses.",
          "• Do not use reports to insult or threaten anyone, or to advertise.",
          "Statuses describe what happened to a report, not whether it is true: none of them means that a report was checked or confirmed.",
          "By filing a report you agree that it is shown publicly on the site and may be forwarded as described in the [privacy policy](/privacy).",
        ],
      },
      {
        heading: "What the team may do",
        body: [
          "Remove a report or an event that breaks these rules or the law, without notice; forward reports to the bodies named in their status; change or stop the service.",
        ],
      },
      {
        heading: "No guarantees",
        body: [
          "The data may be incomplete, late or wrong, and the site may be unavailable. The project is run on a best-effort basis.",
        ],
      },
      {
        heading: "Contact",
        body: [`[${CONTACT}](mailto:${CONTACT})`],
      },
    ],
  },
};

const ru: LegalContent = {
  privacy: {
    metaTitle: "Политика конфиденциальности (черновик)",
    metaDescription:
      "Что Aetheris хранит, когда вы отправляете сообщение или записываетесь на событие, что остаётся на вашем устройстве и как это удалить. Черновик на юридической вычитке.",
    kicker: "Конфиденциальность",
    title: "Политика конфиденциальности",
    draftBanner:
      "Черновик на юридической вычитке. Текст написан командой проекта и описывает, что сайт делает на самом деле; юрист его ещё не проверял, он может измениться.",
    updated: `Черновик от ${LEGAL_DRAFT_DATE}`,
    sections: [
      {
        heading: "Кто ведёт Aetheris",
        body: [
          `Aetheris — независимый студенческий проект, не компания и не государственный орган. Вопросы об этой политике и о ваших данных: [${CONTACT}](mailto:${CONTACT}).`,
        ],
      },
      {
        heading: "Аккаунтов нет",
        body: [
          "Регистрации нет, мы не спрашиваем имя, e-mail или телефон. Чтобы браузер узнавал свои сообщения, он создаёт случайный идентификатор устройства и хранит его у себя. Идентификатор сохраняется вместе с отправленным, но посетители его не видят, и он не связан с вашей личностью.",
        ],
      },
      {
        heading: "Когда вы отправляете сообщение",
        body: [
          "В общей базе сохраняется и публично показывается на сайте: категория, серьёзность, заголовок, описание, город, время отправки и место на карте, округлённое примерно до 1 км. Статус сообщения (например, «Совпадает с другими сообщениями» или «Передано») тоже публичен.",
          "Пишите только то, что видели сами. Не указывайте в сообщении имена, телефоны, номера машин и домашние адреса других людей — сообщение публичное.",
          "Идентификатор устройства хранится вместе с сообщением, но не публикуется.",
        ],
      },
      {
        heading: "Фото остаётся на вашем устройстве",
        body: [
          "Добавленное фото не загружается на сервер. Браузер уменьшает и пересохраняет его — при этом удаляются метаданные, которые камера записывает в файл, включая GPS-координаты, — и хранит только в памяти этого браузера рядом с вашей копией сообщения. Его не видит никто, включая нас.",
          "Фото удаляется, когда вы удаляете сообщение на этом устройстве или очищаете данные сайта в браузере.",
        ],
      },
      {
        heading: "Ваше местоположение",
        body: [
          "Точку на карте ставите вы; если разрешите, устройство подскажет текущее место. Прежде чем сообщение покинет устройство, координаты округляются до двух знаков после запятой — примерно 1 км, — и база округляет их ещё раз, поэтому точная точка нигде не хранится. Но квадрат в 1 км может указывать на маленькое село или одну улицу: если это важно, сдвиньте точку.",
        ],
      },
      {
        heading: "События, записи и отметки на месте",
        body: [
          "Название события, описание, место встречи, точка на карте и время начала публичны — организатор указывает их, чтобы событие нашли. Записи и отметки на месте хранятся с идентификатором устройства и показываются только числом.",
          "Чтобы отметиться на месте, устройство один раз отправляет своё положение; база вычисляет по нему расстояние до события и удаляет его. Сохраняется только расстояние.",
        ],
      },
      {
        heading: "Защита от массовой рассылки",
        body: [
          "Чтобы один отправитель не засыпал ленту сообщениями под разными идентификаторами, база хранит необратимый хэш сетевого адреса, с которого пришло сообщение. Хэш строится со случайным ключом, который каждый день заменяется новым, а старый удаляется. Сами хэши удаляются через 24 часа. Сетевой адрес не хранится.",
        ],
      },
      {
        heading: "Что мы передаём",
        body: [
          "Команда может передать публичное сообщение — текст, категорию, город и округлённые координаты — в местный акимат или экологическую инспекцию; тогда у сообщения появляется статус ④ и название органа. Идентификатор устройства не передаётся никогда. Если организация ответит и согласится, чтобы её назвали, ответ показывается рядом с сообщением.",
        ],
      },
      {
        heading: "Что хранится в вашем браузере",
        body: [
          "• идентификатор устройства;",
          "• ваши сообщения и их фото;",
          "• выбранные размер текста и тема.",
          "Очистка данных сайта в браузере удаляет всё это. После этого сайт не узнает ваши прежние сообщения, и удалить их сами вы уже не сможете — напишите нам.",
        ],
      },
      {
        heading: "Сервисы, которыми пользуется сайт",
        body: [
          "• Vercel — хостинг сайта и обезличенный подсчёт посещений и скорости страниц (Vercel Web Analytics и Speed Insights);",
          "• Supabase — база данных сообщений и событий;",
          "• Open-Meteo, GBIF и CARTO — ваш браузер напрямую запрашивает у них данные о воздухе, наблюдения видов и фрагменты карты, поэтому, как любой открываемый сайт, они получают ваш сетевой адрес.",
          "Где физически размещена база Supabase и что это означает по законодательству Казахстана — вопрос юридической вычитки.",
        ],
      },
      {
        heading: "Сколько хранятся данные",
        body: [
          "Фиксированный срок хранения сообщений и событий пока не установлен; до тех пор они хранятся, пока их не удалите вы или команда. Хэши сетевых адресов хранятся 24 часа. Этот раздел изменится после юридической вычитки.",
        ],
      },
      {
        heading: "Удаление и запросы",
        body: [
          "На [странице сообщества](/community) у каждого сообщения, отправленного с этого устройства, есть кнопка «Удалить». Сообщение, уже переданное в организацию (статус ④ или ⑤), с устройства удалить нельзя: вместе с ним пропала бы запись о передаче, — напишите нам, и мы его удалим.",
          `Чтобы узнать, что хранится по сообщению, или удалить его, если устройства больше нет: [${CONTACT}](mailto:${CONTACT}), со ссылкой на сообщение.`,
        ],
      },
    ],
  },
  terms: {
    metaTitle: "Условия использования (черновик)",
    metaDescription:
      "Чем является и не является Aetheris, правила для сообщений жителей и что команда может с ними делать. Черновик на юридической вычитке.",
    kicker: "Условия",
    title: "Условия использования",
    draftBanner:
      "Черновик на юридической вычитке. Текст написан командой проекта; юрист его ещё не проверял, он может измениться.",
    updated: `Черновик от ${LEGAL_DRAFT_DATE}`,
    sections: [
      {
        heading: "Что такое Aetheris",
        body: [
          "Aetheris — независимый студенческий проект о состоянии окружающей среды в Казахстане. Это не официальная служба мониторинга, и он не выступает от имени государственных органов.",
          "Часть показателей — живые данные открытых сервисов, часть — модельные оценки, часть — сообщения жителей. Каждый показатель помечен; см. [методологию](/methodology). Модельные значения — оценки, а не измерения.",
        ],
      },
      {
        heading: "Не для экстренных случаев и решений о безопасности",
        body: [
          "Не принимайте решения о безопасности на основе сайта. В экстренной ситуации звоните 112. Официальные данные о качестве воздуха и загрязнении публикуют уполномоченные органы.",
        ],
      },
      {
        heading: "Ваши сообщения",
        body: [
          "• Описывайте то, что видели сами, как можно точнее.",
          "• Не указывайте персональные данные других людей — имена, телефоны, номера машин, частные адреса.",
          "• Не используйте сообщения для оскорблений, угроз или рекламы.",
          "Статусы описывают, что произошло с сообщением, а не то, верно ли оно: ни один из них не означает, что сообщение проверено или подтверждено.",
          "Отправляя сообщение, вы соглашаетесь, что оно будет публично показано на сайте и может быть передано так, как описано в [политике конфиденциальности](/privacy).",
        ],
      },
      {
        heading: "Что может сделать команда",
        body: [
          "Без предупреждения удалить сообщение или событие, нарушающее эти правила или закон; передать сообщения органам, указанным в статусе; изменить или прекратить работу сервиса.",
        ],
      },
      {
        heading: "Без гарантий",
        body: [
          "Данные могут быть неполными, запаздывать или содержать ошибки, а сайт — быть недоступен. Проект работает по мере возможностей.",
        ],
      },
      {
        heading: "Контакт",
        body: [`[${CONTACT}](mailto:${CONTACT})`],
      },
    ],
  },
};

const kk: LegalContent = {
  privacy: {
    metaTitle: "Құпиялылық саясаты (жоба)",
    metaDescription:
      "Хабарлама жібергенде немесе іс-шараға жазылғанда Aetheris не сақтайды, құрылғыңызда не қалады және оны қалай жоюға болады. Заңгерлік тексерудегі жоба.",
    kicker: "Құпиялылық",
    title: "Құпиялылық саясаты",
    draftBanner:
      "Заңгерлік тексерудегі жоба. Мәтінді жоба командасы сайттың іс жүзінде не істейтінін сипаттау үшін жазды; оны заңгер әлі тексерген жоқ, ол өзгеруі мүмкін.",
    updated: `${LEGAL_DRAFT_DATE} жобасы`,
    sections: [
      {
        heading: "Aetheris-ті кім жүргізеді",
        body: [
          `Aetheris — тәуелсіз студенттік жоба, компания да, мемлекеттік орган да емес. Осы саясат және деректеріңіз туралы сұрақтар: [${CONTACT}](mailto:${CONTACT}).`,
        ],
      },
      {
        heading: "Аккаунттар жоқ",
        body: [
          "Тіркелу жоқ, біз атыңызды, e-mail-ді немесе телефонды сұрамаймыз. Браузер өз хабарламаларын тануы үшін кездейсоқ құрылғы идентификаторын жасап, оны өзінде сақтайды. Идентификатор жіберілген деректермен бірге сақталады, бірақ оны келушілер көрмейді және ол сіздің жеке басыңызбен байланыстырылмайды.",
        ],
      },
      {
        heading: "Хабарлама жібергенде",
        body: [
          "Ортақ дерекқорда сақталып, сайтта көпшілікке көрсетіледі: санат, маңыздылық, тақырып, сипаттама, қала, жіберілген уақыт және шамамен 1 км-ге дейін дөңгелектенген картадағы орын. Хабарламаның мәртебесі (мысалы, «Басқа хабарламалармен сәйкес келеді» немесе «Жіберілді») де көпшілікке ашық.",
          "Тек өзіңіз көргенді жазыңыз. Хабарламаға басқа адамдардың аты-жөнін, телефонын, көлік нөмірін және үй мекенжайын жазбаңыз — хабарлама көпшілікке ашық.",
          "Құрылғы идентификаторы хабарламамен бірге сақталады, бірақ жарияланбайды.",
        ],
      },
      {
        heading: "Фото құрылғыңызда қалады",
        body: [
          "Қосылған фото серверге жүктелмейді. Браузер оны кішірейтіп, қайта сақтайды — бұл кезде камера файлға жазатын метадеректер, соның ішінде GPS-координаттар жойылады — және тек осы браузердің жадында хабарламаның сіздегі көшірмесінің жанында сақтайды. Оны ешкім, соның ішінде біз де көрмейміз.",
          "Фото осы құрылғыда хабарламаны жойғанда немесе браузерде сайт деректерін тазалағанда жойылады.",
        ],
      },
      {
        heading: "Орналасқан жеріңіз",
        body: [
          "Картадағы нүктені өзіңіз қоясыз; рұқсат етсеңіз, құрылғы ағымдағы орынды ұсынады. Хабарлама құрылғыдан шықпас бұрын координаттар үтірден кейін екі белгіге дейін — шамамен 1 км — дөңгелектенеді, ал дерекқор оларды тағы бір рет дөңгелектейді, сондықтан нақты нүкте еш жерде сақталмайды. Дегенмен 1 км шаршы шағын ауылды немесе бір көшені көрсетуі мүмкін: бұл маңызды болса, нүктені жылжытыңыз.",
        ],
      },
      {
        heading: "Іс-шаралар, жазылу және орнында белгілену",
        body: [
          "Іс-шараның атауы, сипаттамасы, кездесу орны, картадағы нүктесі және басталу уақыты көпшілікке ашық — ұйымдастырушы оларды іс-шара табылуы үшін көрсетеді. Жазылулар мен белгіленулер құрылғы идентификаторымен сақталады және тек санмен көрсетіледі.",
          "Орнында белгілену үшін құрылғы өз орнын бір рет жібереді; дерекқор ол арқылы іс-шараға дейінгі қашықтықты есептейді де, оны жояды. Тек қашықтық сақталады.",
        ],
      },
      {
        heading: "Жаппай жіберуден қорғау",
        body: [
          "Бір жіберуші әртүрлі идентификаторлармен лентаны толтырып тастамауы үшін дерекқор хабарлама келген желі мекенжайының қайтымсыз хэшін сақтайды. Хэш күн сайын жаңасымен ауыстырылатын кездейсоқ кілтпен жасалады, ескі кілт жойылады. Хэштердің өзі 24 сағаттан кейін жойылады. Желі мекенжайы сақталмайды.",
        ],
      },
      {
        heading: "Біз не жібереміз",
        body: [
          "Команда көпшілікке ашық хабарламаны — мәтінін, санатын, қаласын және дөңгелектенген координаттарын — жергілікті әкімдікке немесе экологиялық инспекцияға жібере алады; сонда хабарламада ④ мәртебесі және органның атауы пайда болады. Құрылғы идентификаторы ешқашан жіберілмейді. Ұйым жауап беріп, атауының көрсетілуіне келісім берсе, жауап хабарламаның жанында көрсетіледі.",
        ],
      },
      {
        heading: "Браузеріңізде не сақталады",
        body: [
          "• құрылғы идентификаторы;",
          "• сіздің хабарламаларыңыз бен олардың фотолары;",
          "• таңдалған мәтін өлшемі мен тақырып.",
          "Браузерде сайт деректерін тазалау мұның бәрін жояды. Осыдан кейін сайт бұрынғы хабарламаларыңызды танымайды, және оларды өзіңіз жоя алмайсыз — бізге жазыңыз.",
        ],
      },
      {
        heading: "Сайт пайдаланатын сервистер",
        body: [
          "• Vercel — сайт хостингі және кірулер мен беттер жылдамдығын жалпылама есептеу (Vercel Web Analytics және Speed Insights);",
          "• Supabase — хабарламалар мен іс-шаралар дерекқоры;",
          "• Open-Meteo, GBIF және CARTO — браузеріңіз ауа сапасы деректерін, түрлер бақылауларын және карта бөліктерін тікелей солардан сұрайды, сондықтан кез келген ашылған сайт сияқты олар желі мекенжайыңызды алады.",
          "Supabase дерекқоры физикалық түрде қай жерде орналасқаны және бұл Қазақстан заңнамасы бойынша нені білдіретіні — заңгерлік тексеру мәселесі.",
        ],
      },
      {
        heading: "Деректер қанша уақыт сақталады",
        body: [
          "Хабарламалар мен іс-шараларды сақтаудың белгіленген мерзімі әлі анықталмаған; оған дейін оларды сіз немесе команда жоймайынша сақталады. Желі мекенжайларының хэштері 24 сағат сақталады. Бұл бөлім заңгерлік тексеруден кейін өзгереді.",
        ],
      },
      {
        heading: "Жою және сұрау салу",
        body: [
          "[Қауымдастық бетінде](/community) осы құрылғыдан жіберілген әр хабарламада «Жою» батырмасы бар. Ұйымға жіберіліп қойған хабарламаны (④ немесе ⑤ мәртебесі) құрылғыдан жоюға болмайды: онымен бірге жіберу туралы жазба да жойылар еді, — бізге жазыңыз, біз оны жоямыз.",
          `Хабарлама бойынша не сақталатынын білу немесе құрылғыңыз енді жоқ болса, оны жою үшін: [${CONTACT}](mailto:${CONTACT}), хабарламаның сілтемесімен.`,
        ],
      },
    ],
  },
  terms: {
    metaTitle: "Пайдалану шарттары (жоба)",
    metaDescription:
      "Aetheris не және не емес, тұрғындар хабарламаларының ережелері және команда олармен не істей алады. Заңгерлік тексерудегі жоба.",
    kicker: "Шарттар",
    title: "Пайдалану шарттары",
    draftBanner:
      "Заңгерлік тексерудегі жоба. Мәтінді жоба командасы жазды; оны заңгер әлі тексерген жоқ, ол өзгеруі мүмкін.",
    updated: `${LEGAL_DRAFT_DATE} жобасы`,
    sections: [
      {
        heading: "Aetheris деген не",
        body: [
          "Aetheris — Қазақстандағы қоршаған ортаның жай-күйі туралы тәуелсіз студенттік жоба. Бұл ресми мониторинг қызметі емес және ешбір мемлекеттік орган атынан сөйлемейді.",
          "Көрсеткіштердің бір бөлігі — ашық сервистердің тірі деректері, бір бөлігі — модельдік бағалаулар, бір бөлігі — тұрғындардың хабарламалары. Әр көрсеткіш белгіленген; [әдістемені](/methodology) қараңыз. Модельдік мәндер — өлшеулер емес, бағалаулар.",
        ],
      },
      {
        heading: "Төтенше жағдайларға және қауіпсіздік шешімдеріне арналмаған",
        body: [
          "Қауіпсіздік туралы шешімді сайт негізінде қабылдамаңыз. Төтенше жағдайда 112-ге қоңырау шалыңыз. Ауа сапасы мен ластану туралы ресми деректерді уәкілетті органдар жариялайды.",
        ],
      },
      {
        heading: "Сіздің хабарламаларыңыз",
        body: [
          "• Өзіңіз көргенді мүмкіндігінше дәл сипаттаңыз.",
          "• Басқа адамдардың жеке деректерін — аты-жөнін, телефонын, көлік нөмірін, жеке мекенжайын көрсетпеңіз.",
          "• Хабарламаларды қорлау, қорқыту немесе жарнама үшін пайдаланбаңыз.",
          "Мәртебелер хабарламаның дұрыстығын емес, онымен не болғанын сипаттайды: олардың ешқайсысы хабарлама тексерілді немесе расталды дегенді білдірмейді.",
          "Хабарлама жіберу арқылы сіз оның сайтта көпшілікке көрсетілуіне және [құпиялылық саясатында](/privacy) сипатталғандай жіберілуі мүмкін екеніне келісесіз.",
        ],
      },
      {
        heading: "Команда не істей алады",
        body: [
          "Осы ережелерді немесе заңды бұзатын хабарламаны не іс-шараны ескертусіз жою; хабарламаларды мәртебеде көрсетілген органдарға жіберу; сервистің жұмысын өзгерту немесе тоқтату.",
        ],
      },
      {
        heading: "Кепілдіктерсіз",
        body: [
          "Деректер толық емес, кешіккен немесе қате болуы мүмкін, ал сайт қолжетімсіз болуы мүмкін. Жоба мүмкіндігінше жұмыс істейді.",
        ],
      },
      {
        heading: "Байланыс",
        body: [`[${CONTACT}](mailto:${CONTACT})`],
      },
    ],
  },
};

const ALL: Record<Locale, LegalContent> = { en, ru, kk };

export function getLegal(locale: Locale): LegalContent {
  return ALL[locale];
}
