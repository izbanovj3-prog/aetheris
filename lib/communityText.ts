/* ─────────────────────────────────────────────────────────────
   AETHERIS · community page text, in three languages

   Everything a visitor reads on /community, /ru/community and
   /kk/community — the feed, the submission flow, statuses, events,
   Eco-Points and the AI-context bubble — lives here, so one place has
   to change when the wording does.

   English is the reference. Russian follows the terms the rest of the
   site already uses («экологическая ситуация», «промышленное
   загрязнение», status ③ «Совпадает с другими сообщениями»). Kazakh is
   listed in docs/kk-review.md for a native speaker to check; it is not
   marked as unchecked in the interface.

   The rule that binds every language equally: no status, chip or
   confirmation may say or imply that a report was verified, confirmed
   or resolved. tests/communityText.test.ts holds all three to it.
   ───────────────────────────────────────────────────────────── */

import { CITY_NAMES, type Locale } from "./i18n";
import type { ReportCategory, ReportStatus, Severity } from "./reports";

type Fn<A extends unknown[] = [number]> = (...a: A) => string;

export interface StatusText {
  label: string;
  gloss: string;
  note: string;
}

export interface CommunityText {
  page: {
    kicker: string;
    title: string;
    feedTitle: string;
    newReport: string;
    sampleCount: Fn;
    sampleNoteLive: Fn;
    sampleNoteOffline: Fn<[number, number]>;
    missionsTitle: string;
    missionsNote: string;
    achievementsTitle: string;
    achievementsNote: string;
    sampleData: string;
    toastFiled: string;
    toastDeleted: string;
    toastSub: string;
    dismiss: string;
  };
  card: {
    you: string;
    sample: string;
    sampleTitle: string;
    filed: string;
    filedTitle: string;
    update: string;
    updateTitle: string;
    independentLead: string;
    independentBody: string;
    photoAlt: Fn<[string]>;
    photoCaption: string;
    transferTitle: string;
    transferBody: Fn<[string, string]>;
    seeToo: string;
    removeReaction: string;
    askAi: string;
    delete: string;
    deleting: string;
    deleteConfirm: string;
    deleteRefused: string;
    deleteUnsupported: string;
    deleteFailed: string;
    corroborationPoints: Fn;
  };
  missions: Array<{ title: string; desc: string }>;
  missionProgress: string;
  missionJoin: string;
  achievements: Array<{ name: string; desc: string }>;
  statuses: Record<ReportStatus, StatusText>;
  legend: { title: string; note: string };
  categories: Record<ReportCategory, { label: string; example: string }>;
  severities: Record<Severity, string>;
  time: { now: string; min: Fn; h: Fn; d: Fn };
  bubble: {
    loading: string;
    failedLead: string;
    failedBody: string;
    title: string;
    sub: Fn<[boolean]>;
    stale: string;
  };
  flow: {
    steps: [string, string, string, string, string];
    stepOf: Fn<[number, string]>;
    titleFiling: string;
    titleFiled: string;
    close: string;
    closeFlow: string;
    photoLede: string;
    photoInputLabel: string;
    photoPreviewAlt: string;
    replace: string;
    processing: string;
    openCamera: string;
    orChoose: string;
    photoNoteGood: Fn;
    photoNoteSmall: Fn<[number, number]>;
    photoNoteSoft: string;
    photoFooter: string;
    photoErrNotImage: string;
    photoErrRead: string;
    photoErrLoad: string;
    photoErrGeneric: string;
    locLede: string;
    locFinding: string;
    locDenied: string;
    locUnsupported: string;
    locDrag: string;
    locPublished: Fn<[string, string]>;
    filedUnder: string;
    selectCity: string;
    cityDerived: string;
    cityManual: string;
    catLede: string;
    detailsLede: string;
    severity: string;
    noteLabel: string;
    notePlaceholder: string;
    parentQuestion: string;
    parentNone: string;
    parentPoints: Fn;
    consentLegend: string;
    consentPublicLead: string;
    consentPublic: string;
    consentPrivateLead: string;
    consentPrivate: string;
    consentRules: string;
    consentCheck: string;
    consentDetails: string;
    privacy: string;
    terms: string;
    consentDrafts: string;
    rateHourly: string;
    rateDaily: string;
    submitFailed: string;
    cancel: string;
    back: string;
    cont: string;
    submit: string;
    submitting: string;
    backToFeed: string;
    autoTitle: Fn<[string, string]>;
    autoBody: Fn<[string]>;
    unspecified: string;
    fieldReport: string;
  };
  confirm: {
    statusLine: Fn<[string]>;
    stored: string;
    local: string;
    nothingElse: string;
    nextTitle: string;
    next: Fn<[string, string, string]>;
    points: Fn;
    photoPoints: Fn;
    followPoints: Fn;
  };
  badges: {
    ecoPoints: string;
    rank: string;
    writtenInConcept: Fn<[string]>;
    next: Fn<[string]>;
    toGo: Fn;
    zero: string;
    rowFiled: Fn;
    rowCorroborated: Fn;
    rowPhoto: Fn;
    rowFollow: Fn;
    countedHere: string;
    geoTitle: string;
    thresholdNote: Fn;
    ladder: string;
    ladderNote: string;
    ranks: Record<string, string>;
    geo: Record<string, { name: string; gloss: string; where: string }>;
  };
  events: {
    title: string;
    scheduled: Fn;
    create: string;
    none: string;
    unreachable: string;
    sampleNote: string;
    sampleTitle: string;
    attendingSample: Fn;
    yours: string;
    going: Fn;
    goingCapped: Fn<[number, number]>;
    checkedInCount: Fn;
    rsvp: string;
    rsvpGoing: string;
    full: string;
    checkedIn: string;
    checkIn: string;
    notOpen: string;
    closed: string;
    hintEarly: string;
    hintClosed: string;
    hintOpen: Fn;
    errRsvp: string;
    errFull: string;
    errNoGeo: string;
    okCheckedIn: Fn<[string]>;
    errTooFar: Fn;
    errTooEarly: string;
    errClosed: string;
    errCheckin: string;
    errPermission: string;
    formKicker: string;
    formTitle: string;
    formClose: string;
    fTitle: string;
    fTitlePh: string;
    fDesc: string;
    fDescPh: string;
    fStarts: string;
    fCap: string;
    fCapPh: string;
    fArea: string;
    fPin: Fn;
    errRate: string;
    errPast: string;
    errCreate: string;
    creating: string;
    createEvent: string;
    cancel: string;
    months: string[];
    samples: Record<string, { title: string; place: string }>;
  };
  ai: {
    airAt: Fn<[string]>;
    airNear: Fn<[string, string]>;
    airText: Fn<[string, number, string, number, number, boolean]>;
    airSource: Fn<[string, string]>;
    bioText: Fn<[number, string, string, string, number, number, number]>;
    bioSource: Fn<[number, number, number]>;
    water: string;
    waste: string;
    noneSource: string;
  };
  seeds: Record<string, { author?: string; city: string; time: string; title: string; body: string }>;
}

/* ═════════════════════════════════ EN ═════════════════════════════════ */

const en: CommunityText = {
  page: {
    kicker: "Residents' reports",
    title: "Community",
    feedTitle: "Field reports",
    newReport: "New report",
    sampleCount: (n) => `${n} seeded examples`,
    sampleNoteLive: (n) =>
      `The ${n} entries marked "Sample" are illustrative, written to demonstrate the feed. Anything without that mark is a real submission stored in the shared database and visible to every visitor.`,
    sampleNoteOffline: (n, c) =>
      `Seeded sample data — ${n} illustrative reports from ${c} example contributors, written to demonstrate the feed. Not real submissions. Reports you file yourself are real but persist only to this browser; the shared datastore is unreachable right now.`,
    missionsTitle: "Active missions",
    missionsNote:
      "Illustrative mission designs with example progress — no mission system is running yet, and the progress shown is not anyone's.",
    achievementsTitle: "Achievements",
    achievementsNote:
      "Illustrative badge set — these four are not wired to anything yet. The geographic badges and the rank ladder above them are real and are computed from your own reports.",
    sampleData: "Sample data",
    toastFiled: "Report filed",
    toastDeleted: "Report deleted",
    toastSub: "nobody has reviewed it",
    dismiss: "Dismiss",
  },
  card: {
    you: "You",
    sample: "Sample",
    sampleTitle: "Illustrative example written to demonstrate the feed — not a real submission.",
    filed: "Filed",
    filedTitle: "Real submission, stored in the shared database and visible to every visitor.",
    update: "Update",
    updateTitle: "A follow-up update on an earlier report.",
    independentLead: "Independent report.",
    independentBody:
      "This account names an outside organisation. Aetheris is not affiliated with it, and the organisation has neither reviewed nor commented on this report.",
    photoAlt: (t) => `Your photo for ${t}`,
    photoCaption: "Only you can see this photo — it was never uploaded and stays on this device.",
    transferTitle: "Transfer log",
    transferBody: (to, date) =>
      `Passed to ${to} on ${date}. This records that the data was sent, and nothing about how it was received or whether anything followed.`,
    seeToo: "I see it too",
    removeReaction: "Remove reaction",
    askAi: "Ask the analyst",
    delete: "Delete",
    deleting: "Deleting…",
    deleteConfirm:
      "Delete this report? It will be removed from the shared feed and from this device. This cannot be undone.",
    deleteRefused:
      "This report can't be deleted from here — usually because it has already been passed to an organisation, or because it was filed before this version of the site. Write to izbanovj3@gmail.com with a link to it and the team will remove it.",
    deleteUnsupported:
      "Deleting from the device isn't available yet. Write to izbanovj3@gmail.com with a link to the report and the team will remove it.",
    deleteFailed: "Couldn't reach the database. Nothing was deleted — try again in a moment.",
    corroborationPoints: (n) => `+${n} Eco-Points on corroboration`,
  },
  missions: [
    { title: "Watershed Watch", desc: "Log 5 water-quality readings from your local waterway this month." },
    { title: "Canopy Census", desc: "Map 20 street trees with species + condition in your district." },
    { title: "Night Sky Audit", desc: "Submit 3 light-pollution measurements after 23:00." },
  ],
  missionProgress: "Progress",
  missionJoin: "Join mission",
  achievements: [
    { name: "First Signal", desc: "First report filed" },
    { name: "Field Naturalist", desc: "25 species logged" },
    { name: "Stream Keeper", desc: "10 water samples" },
    { name: "Ground Truth", desc: "50 reports with a live reading beside them" },
  ],
  statuses: {
    submitted: {
      label: "Submitted",
      gloss: "Filed and stored",
      note: "Filed and stored, with nothing else claimed about it. No moderator has read it, no instrument has checked it, and no other report has corroborated it yet.",
    },
    "ai-context": {
      label: "AI context attached",
      gloss: "Comparable data placed beside it",
      note: "Aetheris Analyst attached comparable open data — the nearest air-quality value from Open-Meteo (CAMS model), or the species-occurrence record for this area. It is context placed beside the report, not a judgement about whether the report is right.",
    },
    corroborated: {
      label: "Matches other reports",
      gloss: "Two or more devices, same place and kind",
      note: "At least two different devices reported this category in this city within 72 hours. That is corroboration, not verification: two devices — not necessarily two people — described the same kind of problem in the same place. It does not mean the reports are accurate, and no instrument has checked them.",
    },
    forwarded: {
      label: "Forwarded to the akimat / environmental inspectorate",
      gloss: "Data handed on",
      note: "A record that this report was handed on to a public body, with who sent it, when and where kept in an open log. It is an event in the report's history, not an assessment of whether it is true, and it implies nothing about how — or whether — the recipient responded.",
    },
    "org-response": {
      label: "Organisation response",
      gloss: "An official comment, quoted as sent",
      note: "An organisation left an official comment on this report, quoted as sent and attributed to it by name. Only organisations that have agreed to appear on the platform are ever named here.",
    },
  },
  legend: {
    title: "Report statuses",
    note: "There is no \"confirmed\" and no \"resolved\" status, and there will not be one until something real stands behind it. Aetheris has no moderators and no instrument check for a field report, so the furthest the platform goes is saying that different devices described the same thing, or that data was passed on. Neither of those means a report is right.",
  },
  categories: {
    air: { label: "Air", example: "e.g. Heavy smog over Almaty after a morning inversion" },
    water: { label: "Water", example: "e.g. Oil sheen along the Ural delta near Atyrau" },
    waste: { label: "Waste", example: "e.g. Illegal dumping site expanding by the canal" },
    biodiversity: { label: "Biodiversity", example: "e.g. Early flamingo return at Lake Burabay" },
    industrial: { label: "Industrial pollution", example: "e.g. Smelter dust settling on the Balkhash lakefront" },
  },
  severities: { low: "Low", moderate: "Moderate", high: "High", critical: "Critical" },
  time: {
    now: "just now",
    min: (n) => `${n} min ago`,
    h: (n) => `${n} h ago`,
    d: (n) => `${n} d ago`,
  },
  bubble: {
    loading: "Analyst is pulling comparable data…",
    failedLead: "Context unavailable.",
    failedBody:
      "The open-data feed didn't answer, so nothing could be placed beside this report right now. This says nothing about the report itself — reload to try again.",
    title: "AI context",
    sub: (none) => `Context, not a verdict — ${none ? "no live source for this category" : "open data from beside the report"}`,
    stale:
      "This value was fetched when this page loaded, not when the report was filed. For a report from the last hour those are close to the same thing; for an older one they are not.",
  },
  flow: {
    steps: ["Photo", "Location", "Category", "Severity & note", "Submitted"],
    stepOf: (n, t) => `Step ${n} of 5 · ${t}`,
    titleFiling: "File a field report",
    titleFiled: "Report filed",
    close: "Close",
    closeFlow: "Close report flow",
    photoLede:
      "Optional, and only for you: the photo is not uploaded and nobody else will see it. It stays in this browser as your own record — a repeat photo of the same place later shows what changed. The grid is a framing guide for that.",
    photoInputLabel: "Take or choose a photo",
    photoPreviewAlt: "Report photo preview",
    replace: "Replace",
    processing: "Processing image…",
    openCamera: "Open camera",
    orChoose: "or choose an existing photo",
    photoNoteGood: (n) => `Sharp and large enough — +${n} Eco-Points.`,
    photoNoteSmall: (w, h) => `Small image (${w}×${h}). It will still be filed; it just doesn't earn the photo bonus.`,
    photoNoteSoft: "Looks soft or out of focus. It will still be filed; it just doesn't earn the photo bonus.",
    photoFooter:
      "The image is shrunk and re-saved on your device, which removes the camera's metadata, including its GPS position. The report itself is just as valid without a photo.",
    photoErrNotImage: "Please choose an image file.",
    photoErrRead: "Couldn't read that file.",
    photoErrLoad: "Couldn't load that image.",
    photoErrGeneric: "Couldn't add that image.",
    locLede:
      "Your position is filled in automatically. Drag the pin — or tap the map — if it landed in the wrong place, which is common when the photo was taken from a window or from higher ground.",
    locFinding: "Finding your position…",
    locDenied: "Location permission refused — drag the pin to where this was seen.",
    locUnsupported: "This browser can't report a position — drag the pin to where this was seen.",
    locDrag: "Drag the pin, or tap the map, to correct the location.",
    locPublished: (la, lo) => `Will be published as ${la}, ${lo} — rounded to about 1 km.`,
    filedUnder: "Filed under",
    selectCity: "Select the nearest monitored city…",
    cityDerived: "Nearest city to the pin. This is the city the report is grouped under.",
    cityManual: "The report is grouped under this city on the map and in the per-city counts.",
    catLede: "What kind of problem is this? The five categories match the layers on the map.",
    detailsLede: "How bad is it, and anything you want to add. The note is optional.",
    severity: "Severity",
    noteLabel: "Note (optional)",
    notePlaceholder: "What did you see? Smells, colours, how long it has been there, anything affected.",
    parentQuestion: "Is this an update on one of your earlier reports?",
    parentNone: "No — this is a new report",
    parentPoints: (n) => `An "after" photo following a cleanup or a response is worth +${n} Eco-Points.`,
    consentLegend: "Before you send",
    consentPublicLead: "Public, for everyone to see:",
    consentPublic: "category, severity, your note, the city, the time, and the pin rounded to about 1 km.",
    consentPrivateLead: "Not sent anywhere:",
    consentPrivate:
      "the photo, which stays in this browser, and the exact pin. No name, e-mail or phone number is asked for or stored.",
    consentRules:
      "Please don't include other people's names, phone numbers, car plates or home addresses. You can delete the report from this device later.",
    consentCheck: "I understand this report will be public as described above.",
    consentDetails: "Details:",
    privacy: "privacy policy",
    terms: "terms of use",
    consentDrafts: "(drafts under legal review).",
    rateHourly:
      "You've hit the submission limit for now — everything you entered is still here, try again in a little while.",
    rateDaily: "You've hit today's submission limit — everything you entered is still here, try again tomorrow.",
    submitFailed: "Submission failed. Please try again.",
    cancel: "Cancel",
    back: "Back",
    cont: "Continue",
    submit: "Submit report",
    submitting: "Submitting…",
    backToFeed: "Back to the feed",
    autoTitle: (label, where) => `${label} · ${where}`,
    autoBody: (where) =>
      `Filed from ${where} with no written description. Category and severity were chosen by the reporter; nothing further was stated.`,
    unspecified: "unspecified location",
    fieldReport: "Field report",
  },
  confirm: {
    statusLine: (gloss) => `${gloss} · status ①`,
    stored:
      "Your report is stored and is now visible to everyone on the map and in the feed, with its position rounded to about 1 km. Any photo stayed on this device.",
    local:
      "The shared database could not be reached, so your report is saved in this browser only — you can see it, nobody else can. It is not lost, but it has not been filed to the network either.",
    nothingElse:
      "That is all that has happened to it: nobody has reviewed it, no instrument has been compared against it, and Aetheris is not stating that what you described is or is not the case.",
    nextTitle: "What can happen next",
    next: (ai, city, corr) =>
      `If a live feed covers your category and area, Aetheris Analyst will attach open data beside it as context — «${ai}». If someone else reports the same category in ${city} within 72 hours from a different device, both move to «${corr}» — which means two devices described the same thing, not that either of you is right.`,
    points: (n) => `+${n} Eco-Points for filing`,
    photoPoints: (n) => ` · +${n} for the photo`,
    followPoints: (n) => ` · +${n} for the follow-up`,
  },
  badges: {
    ecoPoints: "Eco-Points",
    rank: "Rank",
    writtenInConcept: (n) => `Written «${n}» in the Community 2.0 concept.`,
    next: (n) => `Next · ${n}`,
    toGo: (n) => `${n} to go`,
    zero: "You have not filed a report from this device yet, so this is zero. It is not a score anyone assigned you — Eco-Points are counted in this browser from your own reports, and clearing site data clears them. They are a progress display: they cannot be spent, transferred or exchanged for anything, and nothing on the platform is gated behind them.",
    rowFiled: (n) => `Reports filed · ${n} each`,
    rowCorroborated: (n) => `Matched other reports · ${n} each`,
    rowPhoto: (n) => `Photo quality · ${n} each`,
    rowFollow: (n) => `Follow-up updates · ${n} each`,
    countedHere: "Counted in this browser from your own reports. Not transferable, not redeemable, no monetary value.",
    geoTitle: "Geographic badges",
    thresholdNote: (n) =>
      `The Community 2.0 concept names this badge and its region but no report count. The threshold of ${n} is Aetheris's, matching the Aral badge, and can be retuned — it is not from the document.`,
    ladder: "The full rank ladder ▾",
    ladderNote:
      "Observer, Sentinel and Constellation are the names already used on the platform; Field Researcher and Eco-Inspector are the two ranks the Community 2.0 concept inserts between them. The point thresholds are Aetheris's own — the concept sets the order, not the numbers.",
    ranks: {},
    geo: {},
  },
  events: {
    title: "Local eco-events",
    scheduled: (n) => `${n} scheduled`,
    create: "Create",
    none: "No events have been created yet. Anyone can add one — a cleanup, a survey, a mapping walk — and people can RSVP and check in when they arrive.",
    unreachable:
      "The events datastore isn't reachable from here, so no real events can be listed or created right now. The examples below are the illustrative ones that have always been on this page.",
    sampleNote:
      "Illustrative examples with invented attendee counts, kept from the original static block to show what the section is for. They are not scheduled gatherings, there is no sign-up behind them, and no one is attending them.",
    sampleTitle: "Illustrative example — not a scheduled gathering.",
    attendingSample: (n) => `${n} attending (illustrative)`,
    yours: "Yours",
    going: (n) => `${n} going`,
    goingCapped: (n, c) => `${n}/${c} going`,
    checkedInCount: (n) => ` · ${n} checked in`,
    rsvp: "RSVP",
    rsvpGoing: "Going ✓",
    full: "Full",
    checkedIn: "Checked in ✓",
    checkIn: "Check in",
    notOpen: "Check-in not open",
    closed: "Check-in closed",
    hintEarly: "Check-in opens an hour before the start.",
    hintClosed: "Check-in closed four hours after the start.",
    hintOpen: (m) => `Uses your location once to measure the distance — you must be within ${m} m of the event. The position is not stored.`,
    errRsvp: "Couldn't update your RSVP — the events datastore didn't answer.",
    errFull: "This event is full.",
    errNoGeo: "This browser can't report a position, so it can't check you in.",
    okCheckedIn: (t) => `Checked in at ${t}.`,
    errTooFar: (m) => `You're further than ${m} m from the event location, so the check-in wasn't recorded.`,
    errTooEarly: "Check-in opens an hour before the event starts.",
    errClosed: "Check-in closed four hours after the event started.",
    errCheckin: "Couldn't record the check-in.",
    errPermission: "Location permission is required to check in at an event.",
    formKicker: "Organise something",
    formTitle: "New event",
    formClose: "Close event form",
    fTitle: "Title",
    fTitlePh: "e.g. Ile-Alatau foothills cleanup",
    fDesc: "What is it",
    fDescPh: "What are you doing, what should people bring, where exactly do you meet?",
    fStarts: "Starts",
    fCap: "Participant cap (optional)",
    fCapPh: "No limit",
    fArea: "Area",
    fPin: (m) => `Drag the pin to the meeting point. Check-in only works within ${m} m of it.`,
    errRate: "You've created three events in the last day — that's the limit for now.",
    errPast: "That start time is in the past.",
    errCreate: "Couldn't create the event — the datastore didn't accept it.",
    creating: "Creating…",
    createEvent: "Create event",
    cancel: "Cancel",
    months: ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"],
    samples: {},
  },
  ai: {
    airAt: (c) => `For ${c}, the Open-Meteo air-quality value (CAMS model)`,
    airNear: (c, km) => `The nearest city with an open-data value (${c}, ${km} km away)`,
    airText: (where, aqi, band, pm25, no2, industrial) =>
      `${where} currently reads US AQI ${aqi} (${band}), PM2.5 ${pm25} µg/m³ and NO₂ ${no2} ppb. ` +
      `This is a model estimate for the surrounding area, not a check on the report: ` +
      `it is not a measurement at the exact spot and may differ from what was seen there, ` +
      `and it says nothing about ${industrial ? "the source of what was seen" : "the cause of it"}.`,
    airSource: (c, at) => `Open-Meteo Air Quality API (CAMS model) · ${c} · read ${at}`,
    bioText: (km, city, records, species, years, from, to) =>
      `Within ${km} km of ${city}, GBIF holds ${records} occurrence records covering ${species} distinct species ` +
      `from the last ${years} years (${from}–${to}). ` +
      `That is a record of what people have published from this area, so it reflects how much surveying ` +
      `has happened as much as what lives there. It is background for reading this report, not a check on it.`,
    bioSource: (km, from, to) => `GBIF occurrence search · ${km} km radius · ${from}–${to}`,
    water:
      "No live water-quality feed covering Kazakhstan at this granularity has been identified, so there is no instrument reading to place beside this report. The Water Quality Index shown elsewhere on the platform is modeled, not measured, and quoting a modeled number here would suggest a check that did not happen.",
    waste:
      "There is no live feed for waste and dumping — no instrument network measures it. Nothing can be placed beside this report except other people's reports from the same area.",
    noneSource: "Aetheris Analyst · no live source available for this category",
  },
  seeds: {},
};

/* ═════════════════════════════════ RU ═════════════════════════════════ */

const ru: CommunityText = {
  page: {
    kicker: "Сообщения жителей",
    title: "Сообщество",
    feedTitle: "Сообщения с мест",
    newReport: "Новое сообщение",
    sampleCount: (n) => `${n} примеров`,
    sampleNoteLive: (n) =>
      `${n} записей с пометкой «Пример» написаны для демонстрации ленты. Всё без этой пометки — настоящие сообщения, сохранённые в общей базе и видимые всем посетителям.`,
    sampleNoteOffline: (n, c) =>
      `Демонстрационные данные — ${n} примеров от ${c} вымышленных авторов, написанных, чтобы показать ленту. Это не настоящие сообщения. Ваши собственные сообщения настоящие, но сейчас сохраняются только в этом браузере: общая база недоступна.`,
    missionsTitle: "Активные миссии",
    missionsNote:
      "Примеры миссий с условным прогрессом — системы миссий пока нет, и показанный прогресс никому не принадлежит.",
    achievementsTitle: "Достижения",
    achievementsNote:
      "Примерный набор значков — эти четыре пока ни к чему не подключены. Географические значки и лестница званий выше настоящие и считаются по вашим собственным сообщениям.",
    sampleData: "Пример",
    toastFiled: "Сообщение отправлено",
    toastDeleted: "Сообщение удалено",
    toastSub: "его никто не проверял",
    dismiss: "Закрыть",
  },
  card: {
    you: "Вы",
    sample: "Пример",
    sampleTitle: "Пример, написанный для демонстрации ленты, — не настоящее сообщение.",
    filed: "В базе",
    filedTitle: "Настоящее сообщение, сохранено в общей базе и видно всем посетителям.",
    update: "Обновление",
    updateTitle: "Продолжение одного из более ранних сообщений.",
    independentLead: "Независимое сообщение.",
    independentBody:
      "В тексте упоминается сторонняя организация. Aetheris с ней не связан, и организация это сообщение не видела и не комментировала.",
    photoAlt: (t) => `Ваше фото к сообщению «${t}»`,
    photoCaption: "Это фото видите только вы: оно не загружалось и хранится на этом устройстве.",
    transferTitle: "Журнал передачи",
    transferBody: (to, date) =>
      `Передано: ${to}, ${date}. Это запись о том, что данные отправлены, и ничего не говорит о том, как их приняли и последовало ли что-то.`,
    seeToo: "Я тоже это вижу",
    removeReaction: "Убрать отметку",
    askAi: "Спросить аналитика",
    delete: "Удалить",
    deleting: "Удаление…",
    deleteConfirm:
      "Удалить сообщение? Оно исчезнет из общей ленты и с этого устройства. Отменить это нельзя.",
    deleteRefused:
      "Удалить это сообщение отсюда нельзя — обычно потому, что оно уже передано в организацию или отправлено до этой версии сайта. Напишите на izbanovj3@gmail.com со ссылкой на него, и команда его удалит.",
    deleteUnsupported:
      "Удаление с устройства пока недоступно. Напишите на izbanovj3@gmail.com со ссылкой на сообщение, и команда его удалит.",
    deleteFailed: "Не удалось связаться с базой. Ничего не удалено — попробуйте ещё раз чуть позже.",
    corroborationPoints: (n) => `+${n} Eco-Points при совпадении`,
  },
  missions: [
    { title: "Дозор водосбора", desc: "Внесите 5 наблюдений за качеством воды в ближайшем водоёме за этот месяц." },
    { title: "Перепись деревьев", desc: "Отметьте на карте 20 уличных деревьев с видом и состоянием в своём районе." },
    { title: "Ночное небо", desc: "Отправьте 3 замера светового загрязнения после 23:00." },
  ],
  missionProgress: "Прогресс",
  missionJoin: "Присоединиться",
  achievements: [
    { name: "Первый сигнал", desc: "Первое сообщение" },
    { name: "Натуралист", desc: "25 видов в наблюдениях" },
    { name: "Хранитель ручья", desc: "10 проб воды" },
    { name: "Сверка на месте", desc: "50 сообщений с открытыми данными рядом" },
  ],
  statuses: {
    submitted: {
      label: "Отправлен",
      gloss: "Получено и сохранено",
      note: "Сообщение получено и сохранено — и больше о нём ничего не утверждается. Его не читал модератор, его не сверяли с приборами, и других совпадающих сообщений пока нет.",
    },
    "ai-context": {
      label: "AI-контекст добавлен",
      gloss: "Рядом показаны сопоставимые данные",
      note: "Аналитик Aetheris показал рядом сопоставимые открытые данные — ближайшее значение качества воздуха из Open-Meteo (модель CAMS) или записи о встречаемости видов в этом районе. Это контекст рядом с сообщением, а не оценка того, верно ли оно.",
    },
    corroborated: {
      label: "Совпадает с другими сообщениями",
      gloss: "Два и более устройства, то же место и тема",
      note: "Не менее двух разных устройств сообщили об этой категории в этом городе в течение 72 часов. Это совпадение, а не проверка: два устройства — не обязательно два разных человека — описали похожую проблему в одном месте. Это не значит, что сообщения точны, и приборами их никто не сверял.",
    },
    forwarded: {
      label: "Передано в акимат/эко-инспекцию",
      gloss: "Данные переданы",
      note: "Запись о том, что сообщение передано государственному органу: кто, когда и куда отправил, хранится в открытом журнале. Это событие в истории сообщения, а не оценка его достоверности, и оно ничего не говорит о том, ответил ли получатель и как.",
    },
    "org-response": {
      label: "Ответ организации",
      gloss: "Официальный комментарий, дословно",
      note: "Организация оставила официальный комментарий к сообщению; он приводится дословно и с указанием организации. Здесь называются только организации, согласившиеся появиться на платформе.",
    },
  },
  legend: {
    title: "Статусы сообщений",
    note: "Статусов «подтверждено» и «решено» нет и не будет, пока за ними не стоит что-то реальное. У Aetheris нет модераторов и нет приборной проверки сообщений, поэтому дальше всего платформа может сказать, что разные устройства описали одно и то же или что данные переданы. Ни то ни другое не означает, что сообщение верно.",
  },
  categories: {
    air: { label: "Воздух", example: "напр. плотный смог над Алматы после утренней инверсии" },
    water: { label: "Вода", example: "напр. нефтяная плёнка в дельте Урала у Атырау" },
    waste: { label: "Отходы", example: "напр. незаконная свалка разрастается у канала" },
    biodiversity: { label: "Биоразнообразие", example: "напр. ранний прилёт фламинго на Бурабае" },
    industrial: { label: "Промышленное загрязнение", example: "напр. пыль от завода оседает на берегу Балхаша" },
  },
  severities: { low: "Низкая", moderate: "Средняя", high: "Высокая", critical: "Критическая" },
  time: {
    now: "только что",
    min: (n) => `${n} мин назад`,
    h: (n) => `${n} ч назад`,
    d: (n) => `${n} дн назад`,
  },
  bubble: {
    loading: "Аналитик подбирает сопоставимые данные…",
    failedLead: "Контекст недоступен.",
    failedBody:
      "Источник открытых данных не ответил, поэтому рядом с сообщением сейчас ничего не показать. Это ничего не говорит о самом сообщении — обновите страницу, чтобы попробовать снова.",
    title: "AI-контекст",
    sub: (none) => `Контекст, не вердикт — ${none ? "для этой категории нет живого источника" : "открытые данные рядом с сообщением"}`,
    stale:
      "Значение получено при загрузке страницы, а не в момент отправки сообщения. Для сообщения последнего часа это почти одно и то же; для более старого — нет.",
  },
  flow: {
    steps: ["Фото", "Место", "Категория", "Серьёзность и заметка", "Отправлено"],
    stepOf: (n, t) => `Шаг ${n} из 5 · ${t}`,
    titleFiling: "Сообщить о проблеме",
    titleFiled: "Сообщение отправлено",
    close: "Закрыть",
    closeFlow: "Закрыть форму сообщения",
    photoLede:
      "Необязательно и только для вас: фото не загружается на сервер, и его никто больше не увидит. Оно хранится в этом браузере как ваша запись — повторное фото того же места позже покажет, что изменилось. Сетка помогает выстроить кадр одинаково.",
    photoInputLabel: "Сделать или выбрать фото",
    photoPreviewAlt: "Предпросмотр фото",
    replace: "Заменить",
    processing: "Обработка изображения…",
    openCamera: "Открыть камеру",
    orChoose: "или выбрать готовое фото",
    photoNoteGood: (n) => `Чёткое и достаточно крупное — +${n} Eco-Points.`,
    photoNoteSmall: (w, h) => `Маленькое изображение (${w}×${h}). Сообщение всё равно отправится, просто без бонуса за фото.`,
    photoNoteSoft: "Выглядит нерезким. Сообщение всё равно отправится, просто без бонуса за фото.",
    photoFooter:
      "Изображение уменьшается и пересохраняется на вашем устройстве — при этом удаляются метаданные камеры, включая GPS-координаты. Сообщение без фото так же действительно.",
    photoErrNotImage: "Выберите файл изображения.",
    photoErrRead: "Не удалось прочитать файл.",
    photoErrLoad: "Не удалось открыть изображение.",
    photoErrGeneric: "Не удалось добавить изображение.",
    locLede:
      "Место заполняется автоматически. Перетащите метку — или нажмите на карту, — если она встала не туда; так часто бывает, когда снимали из окна или с высоты.",
    locFinding: "Определяем местоположение…",
    locDenied: "Доступ к местоположению запрещён — перетащите метку туда, где это было.",
    locUnsupported: "Этот браузер не сообщает местоположение — перетащите метку туда, где это было.",
    locDrag: "Перетащите метку или нажмите на карту, чтобы уточнить место.",
    locPublished: (la, lo) => `Будет опубликовано как ${la}, ${lo} — с округлением примерно до 1 км.`,
    filedUnder: "Город",
    selectCity: "Выберите ближайший город…",
    cityDerived: "Ближайший к метке город. Под этим городом сообщение будет учтено.",
    cityManual: "Под этим городом сообщение показывается на карте и в подсчётах по городам.",
    catLede: "Что это за проблема? Пять категорий совпадают со слоями карты.",
    detailsLede: "Насколько это серьёзно и что вы хотите добавить. Заметка необязательна.",
    severity: "Серьёзность",
    noteLabel: "Заметка (необязательно)",
    notePlaceholder: "Что вы видели? Запах, цвет, как давно это там, что затронуто.",
    parentQuestion: "Это продолжение одного из ваших прежних сообщений?",
    parentNone: "Нет — это новое сообщение",
    parentPoints: (n) => `Фото «после» уборки или ответа на сообщение даёт +${n} Eco-Points.`,
    consentLegend: "Перед отправкой",
    consentPublicLead: "Публично, видно всем:",
    consentPublic: "категория, серьёзность, ваша заметка, город, время и точка на карте, округлённая примерно до 1 км.",
    consentPrivateLead: "Никуда не отправляется:",
    consentPrivate:
      "фото — оно остаётся в этом браузере — и точная точка. Имя, e-mail и телефон не запрашиваются и не хранятся.",
    consentRules:
      "Не указывайте имена, телефоны, номера машин и домашние адреса других людей. Позже сообщение можно удалить с этого устройства.",
    consentCheck: "Я понимаю, что сообщение будет опубликовано, как описано выше.",
    consentDetails: "Подробнее:",
    privacy: "политика конфиденциальности",
    terms: "условия использования",
    consentDrafts: "(черновики на юридической вычитке).",
    rateHourly: "Лимит отправки на ближайшее время исчерпан — всё введённое сохранено, попробуйте чуть позже.",
    rateDaily: "Дневной лимит отправки исчерпан — всё введённое сохранено, попробуйте завтра.",
    submitFailed: "Отправить не удалось. Попробуйте ещё раз.",
    cancel: "Отмена",
    back: "Назад",
    cont: "Далее",
    submit: "Отправить",
    submitting: "Отправка…",
    backToFeed: "Вернуться к ленте",
    autoTitle: (label, where) => `${label} · ${where}`,
    autoBody: (where) =>
      `Отправлено из места «${where}» без описания. Категорию и серьёзность выбрал автор; больше ничего не указано.`,
    unspecified: "место не указано",
    fieldReport: "Сообщение",
  },
  confirm: {
    statusLine: (gloss) => `${gloss} · статус ①`,
    stored:
      "Сообщение сохранено и теперь видно всем на карте и в ленте; место округлено примерно до 1 км. Фото, если было, осталось на этом устройстве.",
    local:
      "Общая база недоступна, поэтому сообщение сохранено только в этом браузере — его видите вы, но не другие. Оно не потеряно, но и в общую ленту не попало.",
    nothingElse:
      "Больше с ним ничего не произошло: его никто не проверял, с приборами его не сверяли, и Aetheris не утверждает, что описанное верно или неверно.",
    nextTitle: "Что может произойти дальше",
    next: (ai, city, corr) =>
      `Если для вашей категории и района есть живой источник, аналитик Aetheris покажет рядом открытые данные как контекст — «${ai}». Если кто-то ещё в течение 72 часов с другого устройства сообщит о той же категории в городе ${city}, оба сообщения получат статус «${corr}» — это значит, что два устройства описали одно и то же, а не что кто-то из вас прав.`,
    points: (n) => `+${n} Eco-Points за сообщение`,
    photoPoints: (n) => ` · +${n} за фото`,
    followPoints: (n) => ` · +${n} за продолжение`,
  },
  badges: {
    ecoPoints: "Eco-Points",
    rank: "Звание",
    writtenInConcept: (n) => `В концепции Community 2.0 — «${n}».`,
    next: (n) => `Следующее · ${n}`,
    toGo: (n) => `осталось ${n}`,
    zero: "С этого устройства вы ещё не отправляли сообщений, поэтому здесь ноль. Это не оценка, которую вам кто-то поставил: Eco-Points считаются в этом браузере по вашим собственным сообщениям, и очистка данных сайта их обнуляет. Это показатель прогресса: их нельзя потратить, передать или на что-то обменять, и ничего на платформе от них не зависит.",
    rowFiled: (n) => `Сообщения · по ${n}`,
    rowCorroborated: (n) => `Совпадения с другими · по ${n}`,
    rowPhoto: (n) => `Качество фото · по ${n}`,
    rowFollow: (n) => `Продолжения · по ${n}`,
    countedHere: "Считается в этом браузере по вашим сообщениям. Не передаётся, не обменивается, денежной ценности не имеет.",
    geoTitle: "Географические значки",
    thresholdNote: (n) =>
      `Концепция Community 2.0 называет этот значок и регион, но не число сообщений. Порог ${n} установлен Aetheris по аналогии со значком Арала и может меняться — его нет в документе.`,
    ladder: "Вся лестница званий ▾",
    ladderNote:
      "«Наблюдатель», «Страж» и «Созвездие» — названия, которые уже были на платформе; «Полевой исследователь» и «Экоинспектор» — два звания, которые концепция Community 2.0 добавляет между ними. Пороги очков — собственные Aetheris: концепция задаёт порядок, а не числа.",
    ranks: {
      Newcomer: "Новичок",
      "Observer I": "Наблюдатель I",
      "Observer II": "Наблюдатель II",
      "Observer III": "Наблюдатель III",
      "Field Researcher": "Полевой исследователь",
      "Eco-Inspector": "Экоинспектор",
      "Sentinel I": "Страж I",
      "Sentinel II": "Страж II",
      "Sentinel III": "Страж III",
      Constellation: "Созвездие",
    },
    geo: {
      almaty: { name: "Исследователь Алматы", gloss: "Алматы", where: "Алматы и Алматинская область" },
      aral: { name: "Стражи Арала", gloss: "Арал", where: "Бассейн Аральского моря — Аральск, Кызылорда" },
      industrial: { name: "Индустриальный дозор", gloss: "Промышленный пояс", where: "Промышленный пояс Темиртау — Караганда" },
      balkhash: { name: "Хранитель Балхаша", gloss: "Балхаш", where: "Бассейн озера Балхаш" },
      caspian: { name: "Каспийский дозорный", gloss: "Каспий", where: "Побережье Каспия — Атырау, Актау, Жанаозен" },
    },
  },
  events: {
    title: "Местные экособытия",
    scheduled: (n) => `запланировано: ${n}`,
    create: "Создать",
    none: "Событий пока нет. Добавить может любой — уборку, обследование, картографическую прогулку, — а другие смогут записаться и отметиться на месте.",
    unreachable:
      "База событий отсюда недоступна, поэтому сейчас нельзя ни показать, ни создать настоящие события. Ниже — примеры, которые всегда были на этой странице.",
    sampleNote:
      "Примеры с вымышленным числом участников, оставленные из прежнего статичного блока, чтобы показать, для чего этот раздел. Это не запланированные встречи: записи на них нет, и никто на них не идёт.",
    sampleTitle: "Пример — не запланированная встреча.",
    attendingSample: (n) => `${n} участников (пример)`,
    yours: "Ваше",
    going: (n) => `идут: ${n}`,
    goingCapped: (n, c) => `идут: ${n}/${c}`,
    checkedInCount: (n) => ` · отметились: ${n}`,
    rsvp: "Записаться",
    rsvpGoing: "Иду ✓",
    full: "Мест нет",
    checkedIn: "Отметились ✓",
    checkIn: "Отметиться",
    notOpen: "Отметка ещё не открыта",
    closed: "Отметка закрыта",
    hintEarly: "Отметка открывается за час до начала.",
    hintClosed: "Отметка закрылась через четыре часа после начала.",
    hintOpen: (m) => `Один раз использует ваше местоположение, чтобы измерить расстояние, — нужно быть не дальше ${m} м от места. Координаты не сохраняются.`,
    errRsvp: "Не удалось изменить запись — база событий не ответила.",
    errFull: "На это событие мест больше нет.",
    errNoGeo: "Этот браузер не сообщает местоположение, поэтому отметиться нельзя.",
    okCheckedIn: (t) => `Вы отметились: ${t}.`,
    errTooFar: (m) => `Вы дальше ${m} м от места события, поэтому отметка не засчитана.`,
    errTooEarly: "Отметка открывается за час до начала события.",
    errClosed: "Отметка закрылась через четыре часа после начала события.",
    errCheckin: "Не удалось отметиться.",
    errPermission: "Чтобы отметиться на событии, нужен доступ к местоположению.",
    formKicker: "Организовать",
    formTitle: "Новое событие",
    formClose: "Закрыть форму события",
    fTitle: "Название",
    fTitlePh: "напр. уборка предгорий Иле-Алатау",
    fDesc: "Что это",
    fDescPh: "Что вы делаете, что взять с собой, где именно встречаемся?",
    fStarts: "Начало",
    fCap: "Лимит участников (необязательно)",
    fCapPh: "Без лимита",
    fArea: "Район",
    fPin: (m) => `Перетащите метку на место встречи. Отметка работает только в радиусе ${m} м от неё.`,
    errRate: "Вы создали три события за сутки — это пока предел.",
    errPast: "Это время начала уже прошло.",
    errCreate: "Не удалось создать событие — база его не приняла.",
    creating: "Создание…",
    createEvent: "Создать событие",
    cancel: "Отмена",
    months: ["ЯНВ", "ФЕВ", "МАР", "АПР", "МАЙ", "ИЮН", "ИЮЛ", "АВГ", "СЕН", "ОКТ", "НОЯ", "ДЕК"],
    samples: {
      "sample-ile-alatau": { title: "Уборка предгорий Иле-Алатау", place: "Алматы" },
      "sample-heat-island": { title: "Прогулка с картированием «острова тепла»", place: "Астана" },
      "sample-balkhash": { title: "Обследование берега Балхаша", place: "Балхаш" },
    },
  },
  ai: {
    airAt: (c) => `Для города ${c} значение качества воздуха Open-Meteo (модель CAMS)`,
    airNear: (c, km) => `Ближайший город с открытыми данными (${c}, ${km} км)`,
    airText: (where, aqi, band, pm25, no2, industrial) =>
      `${where} сейчас показывает US AQI ${aqi} (${band}), PM2.5 ${pm25} мкг/м³ и NO₂ ${no2} ppb. ` +
      `Это модельная оценка для окрестностей, а не проверка сообщения: ` +
      `это не замер в той самой точке, и он может отличаться от увиденного там; ` +
      `ничего не говорит и о ${industrial ? "источнике увиденного" : "причине"}.`,
    airSource: (c, at) => `Open-Meteo Air Quality API (модель CAMS) · ${c} · получено ${at}`,
    bioText: (km, city, records, species, years, from, to) =>
      `В радиусе ${km} км от города ${city} в GBIF ${records} записей о встречаемости, это ${species} видов ` +
      `за последние ${years} лет (${from}–${to}). ` +
      `Это запись того, что люди публиковали из этого района, поэтому она отражает, сколько здесь наблюдали, ` +
      `не меньше, чем то, кто здесь живёт. Это фон для чтения сообщения, а не его проверка.`,
    bioSource: (km, from, to) => `GBIF, поиск встречаемости · радиус ${km} км · ${from}–${to}`,
    water:
      "Живого источника данных о качестве воды по Казахстану с нужной детализацией не найдено, поэтому рядом с сообщением нечего показать из приборов. Индекс качества воды в других разделах — модельный, а не измеренный, и приводить здесь модельное число значило бы намекать на проверку, которой не было.",
    waste:
      "Живого источника по отходам и свалкам нет — их не измеряет никакая сеть приборов. Рядом с этим сообщением можно показать только сообщения других людей из того же района.",
    noneSource: "Аналитик Aetheris · для этой категории живого источника нет",
  },
  seeds: {
    "seed-almaty-smog": {
      author: "Айгерим К.",
      city: "Алматы · Бостандыкский р-н",
      time: "22 мин назад",
      title: "Плотный слой смога после утренней инверсии",
      body: "Серая полоса над южными районами в сторону предгорий. Видимость резко упала; мой портативный прибор показал PM2.5 около 140 мкг/м³ в 08:10 по местному времени.",
    },
    "seed-karaganda-haze": {
      author: "Нурлан Т.",
      city: "Караганда · промышленный район",
      time: "48 мин назад",
      title: "Стойкая дымка над поясом Темиртау — Караганда",
      body: "Бурый шлейф всё утро висит низко, у кольцевой сильный запах серы. Видимость заметно хуже, чем вчера.",
    },
    "seed-karaganda-dust": {
      author: "Салтанат Б.",
      city: "Караганда · промышленный район",
      time: "3 ч назад",
      title: "Серая пыль оседает на машинах у кольцевой",
      body: "К середине утра на каждой припаркованной машине на нашей улице тонкий серый налёт, второй день подряд. В сторону завода виден тот же бурый слой.",
    },
    "seed-atyrau-sheen": {
      author: "Данияр С.",
      city: "Атырау · дельта Урала",
      time: "1 ч назад",
      title: "Нефтяная плёнка расходится вдоль берега",
      body: "Радужная плёнка тянется примерно на 200 м ниже промышленного сброса. Проба записана набором № ATY-07; прошу независимую лабораторную проверку.",
    },
    "seed-aktau-caspian": {
      author: "Зарина М.",
      city: "Актау · берег Каспия",
      time: "2 ч назад",
      title: "Окрашенная пена вдоль каспийского берега",
      body: "Желтоватая пена и химический запах примерно на 150 м пляжа у водозабора. Волонтёры, наблюдающие за тюленями, в курсе.",
    },
    "seed-shymkent-dumping": {
      author: "Бекзат А.",
      city: "Шымкент · канал Бадам",
      time: "4 ч назад",
      title: "Незаконная свалка разрастается вдоль канала",
      body: "Строительный мусор и бытовые отходы сброшены с берега, частично в воду. Третий раз за месяц — прошу передать в акимат.",
    },
    "seed-burabay-flamingo": {
      author: "Мадина Т.",
      city: "Кокшетау · Бурабай",
      time: "5 ч назад",
      title: "Стая фламинго вернулась на озеро раньше обычного",
      body: "Около сорока птиц на северном мелководье — на восемь дней раньше медианы за 10 лет. Записано в трекер миграции.",
    },
  },
};

/* ═════════════════════════════════ KK ═════════════════════════════════ */

const kk: CommunityText = {
  page: {
    kicker: "Тұрғындар хабарламалары",
    title: "Қауымдастық",
    feedTitle: "Жерден хабарламалар",
    newReport: "Жаңа хабарлама",
    sampleCount: (n) => `${n} мысал`,
    sampleNoteLive: (n) =>
      `«Мысал» белгісі бар ${n} жазба лентаны көрсету үшін жазылған. Бұл белгісіз жазбалардың бәрі — ортақ дерекқорда сақталған және барлық келушілерге көрінетін нақты хабарламалар.`,
    sampleNoteOffline: (n, c) =>
      `Көрсетілім деректері — лентаны көрсету үшін ${c} ойдан шығарылған автордың ${n} мысалы. Бұлар нақты хабарламалар емес. Өзіңіз жіберген хабарламалар нақты, бірақ қазір тек осы браузерде сақталады: ортақ дерекқор қолжетімсіз.`,
    missionsTitle: "Белсенді миссиялар",
    missionsNote:
      "Шартты прогресі бар миссия мысалдары — миссия жүйесі әлі жоқ, көрсетілген прогресс ешкімге тиесілі емес.",
    achievementsTitle: "Жетістіктер",
    achievementsNote:
      "Мысал белгілер жиыны — бұл төртеуі әлі ештеңеге қосылмаған. Жоғарыдағы географиялық белгілер мен атақтар сатысы нақты және өз хабарламаларыңыз бойынша есептеледі.",
    sampleData: "Мысал",
    toastFiled: "Хабарлама жіберілді",
    toastDeleted: "Хабарлама жойылды",
    toastSub: "оны ешкім тексерген жоқ",
    dismiss: "Жабу",
  },
  card: {
    you: "Сіз",
    sample: "Мысал",
    sampleTitle: "Лентаны көрсету үшін жазылған мысал — нақты хабарлама емес.",
    filed: "Дерекқорда",
    filedTitle: "Нақты хабарлама, ортақ дерекқорда сақталған және барлық келушілерге көрінеді.",
    update: "Жаңарту",
    updateTitle: "Бұрынғы хабарламаның жалғасы.",
    independentLead: "Тәуелсіз хабарлама.",
    independentBody:
      "Мәтінде бөгде ұйым аталады. Aetheris онымен байланысты емес, ал ұйым бұл хабарламаны көрген де, түсініктеме берген де жоқ.",
    photoAlt: (t) => `«${t}» хабарламасына сіздің фотоңыз`,
    photoCaption: "Бұл фотоны тек сіз көресіз: ол жүктелген жоқ және осы құрылғыда сақталады.",
    transferTitle: "Жіберу журналы",
    transferBody: (to, date) =>
      `Жіберілді: ${to}, ${date}. Бұл деректердің жіберілгені туралы жазба ғана; олардың қалай қабылданғанын немесе бір нәрсе болғанын білдірмейді.`,
    seeToo: "Мен де көріп тұрмын",
    removeReaction: "Белгіні алып тастау",
    askAi: "Аналитиктен сұрау",
    delete: "Жою",
    deleting: "Жойылуда…",
    deleteConfirm: "Хабарламаны жою керек пе? Ол ортақ лентадан және осы құрылғыдан жойылады. Мұны қайтару мүмкін емес.",
    deleteRefused:
      "Бұл хабарлама ұйымға жіберіліп қойған, сондықтан оны осы жерден жоюға болмайды. Сілтемесімен izbanovj3@gmail.com мекенжайына жазыңыз, команда оны жояды.",
    deleteUnsupported:
      "Құрылғыдан жою әлі қолжетімсіз. Хабарламаның сілтемесімен izbanovj3@gmail.com мекенжайына жазыңыз, команда оны жояды.",
    deleteFailed: "Дерекқормен байланысу мүмкін болмады. Ештеңе жойылған жоқ — сәлден кейін қайталаңыз.",
    corroborationPoints: (n) => `Сәйкес келгенде +${n} Eco-Points`,
  },
  missions: [
    { title: "Су жинау алабы күзеті", desc: "Осы айда жақын су айдынынан су сапасы бойынша 5 бақылау енгізіңіз." },
    { title: "Ағаштар санағы", desc: "Ауданыңыздағы 20 көше ағашын түрі мен жағдайымен картаға белгілеңіз." },
    { title: "Түнгі аспан", desc: "23:00-ден кейін жарықпен ластанудың 3 өлшемін жіберіңіз." },
  ],
  missionProgress: "Прогресс",
  missionJoin: "Қосылу",
  achievements: [
    { name: "Алғашқы сигнал", desc: "Алғашқы хабарлама" },
    { name: "Натуралист", desc: "Бақылауда 25 түр" },
    { name: "Бұлақ сақшысы", desc: "10 су сынамасы" },
    { name: "Жерде салыстыру", desc: "Қасында ашық деректері бар 50 хабарлама" },
  ],
  statuses: {
    submitted: {
      label: "Жіберілді",
      gloss: "Қабылданды және сақталды",
      note: "Хабарлама қабылданды және сақталды — ол туралы басқа ештеңе мәлімделмейді. Оны модератор оқыған жоқ, аспаптармен салыстырылған жоқ, әзірге басқа сәйкес хабарламалар да жоқ.",
    },
    "ai-context": {
      label: "ЖИ-контекст қосылды",
      gloss: "Қасында салыстырмалы деректер көрсетілді",
      note: "Aetheris аналитигі қасына салыстырмалы ашық деректерді қойды — Open-Meteo-дан (CAMS моделі) ауа сапасының ең жақын мәнін немесе осы аудандағы түрлердің кездесу жазбаларын. Бұл хабарламаның қасындағы контекст, оның дұрыстығын бағалау емес.",
    },
    corroborated: {
      label: "Басқа хабарламалармен сәйкес келеді",
      gloss: "Екі не одан көп құрылғы, бір орын мен тақырып",
      note: "Кемінде екі түрлі құрылғы 72 сағат ішінде осы қалада осы санат бойынша хабарлады. Бұл тексеру емес, сәйкестік: тәуелсіз адамдар бір жердегі ұқсас мәселені сипаттады. Бұл хабарламалардың дәл екенін білдірмейді, оларды ешкім аспаптармен салыстырған жоқ.",
    },
    forwarded: {
      label: "Әкімдікке / экоинспекцияға жіберілді",
      gloss: "Деректер жіберілді",
      note: "Хабарламаның мемлекеттік органға жіберілгені туралы жазба: кім, қашан және қайда жібергені ашық журналда сақталады. Бұл хабарлама тарихындағы оқиға, оның дұрыстығын бағалау емес, және алушының жауап бергені-бермегені туралы ештеңе айтпайды.",
    },
    "org-response": {
      label: "Ұйымның жауабы",
      gloss: "Ресми түсініктеме, сөзбе-сөз",
      note: "Ұйым хабарламаға ресми түсініктеме қалдырды; ол сөзбе-сөз және ұйымның атымен келтіріледі. Мұнда тек платформада көрінуге келісім берген ұйымдар ғана аталады.",
    },
  },
  legend: {
    title: "Хабарлама мәртебелері",
    note: "«Расталды» және «шешілді» мәртебелері жоқ және артында нақты бір нәрсе тұрмайынша болмайды. Aetheris-те модераторлар да, хабарламаларды аспаптық тексеру де жоқ, сондықтан платформа ең әрі дегенде тәуелсіз адамдар бір нәрсені сипаттағанын немесе деректер жіберілгенін ғана айта алады. Олардың ешқайсысы хабарламаның дұрыс екенін білдірмейді.",
  },
  categories: {
    air: { label: "Ауа", example: "мыс. таңғы инверсиядан кейін Алматы үстіндегі қою түтін" },
    water: { label: "Су", example: "мыс. Атырау маңындағы Жайық сағасында мұнай қабыршағы" },
    waste: { label: "Қалдықтар", example: "мыс. канал жанында заңсыз қоқыс үйіндісі ұлғаюда" },
    biodiversity: { label: "Биоалуантүрлілік", example: "мыс. Бурабайға қоқиқаздардың ерте оралуы" },
    industrial: { label: "Өнеркәсіптік ластану", example: "мыс. зауыт шаңы Балқаш жағасына қонуда" },
  },
  severities: { low: "Төмен", moderate: "Орташа", high: "Жоғары", critical: "Критикалық" },
  time: {
    now: "жаңа ғана",
    min: (n) => `${n} мин бұрын`,
    h: (n) => `${n} сағ бұрын`,
    d: (n) => `${n} күн бұрын`,
  },
  bubble: {
    loading: "Аналитик салыстырмалы деректерді іздеп жатыр…",
    failedLead: "Контекст қолжетімсіз.",
    failedBody:
      "Ашық деректер көзі жауап бермеді, сондықтан хабарламаның қасына қазір ештеңе қою мүмкін емес. Бұл хабарламаның өзі туралы ештеңе айтпайды — қайталау үшін бетті жаңартыңыз.",
    title: "ЖИ-контекст",
    sub: (none) => `Контекст, үкім емес — ${none ? "бұл санат үшін тірі дереккөз жоқ" : "хабарламаның қасындағы ашық деректер"}`,
    stale:
      "Мән хабарлама жіберілген сәтте емес, бет жүктелген кезде алынды. Соңғы сағаттағы хабарлама үшін бұл іс жүзінде бірдей; ескірек хабарлама үшін — жоқ.",
  },
  flow: {
    steps: ["Фото", "Орын", "Санат", "Маңыздылық пен ескертпе", "Жіберілді"],
    stepOf: (n, t) => `5-тен ${n}-қадам · ${t}`,
    titleFiling: "Мәселе туралы хабарлау",
    titleFiled: "Хабарлама жіберілді",
    close: "Жабу",
    closeFlow: "Хабарлама формасын жабу",
    photoLede:
      "Міндетті емес және тек сіз үшін: фото серверге жүктелмейді, оны басқа ешкім көрмейді. Ол осы браузерде сіздің жазбаңыз ретінде сақталады — кейін сол жерді қайта түсірсеңіз, не өзгергені көрінеді. Тор кадрды бірдей құруға көмектеседі.",
    photoInputLabel: "Фото түсіру немесе таңдау",
    photoPreviewAlt: "Фотоны алдын ала қарау",
    replace: "Ауыстыру",
    processing: "Сурет өңделуде…",
    openCamera: "Камераны ашу",
    orChoose: "немесе дайын фотоны таңдау",
    photoNoteGood: (n) => `Анық әрі жеткілікті үлкен — +${n} Eco-Points.`,
    photoNoteSmall: (w, h) => `Шағын сурет (${w}×${h}). Хабарлама бәрібір жіберіледі, тек фото бонусы болмайды.`,
    photoNoteSoft: "Анық емес көрінеді. Хабарлама бәрібір жіберіледі, тек фото бонусы болмайды.",
    photoFooter:
      "Сурет құрылғыңызда кішірейтіліп, қайта сақталады — бұл кезде камераның метадеректері, соның ішінде GPS-координаттары жойылады. Фотосыз хабарлама да сондай жарамды.",
    photoErrNotImage: "Сурет файлын таңдаңыз.",
    photoErrRead: "Файлды оқу мүмкін болмады.",
    photoErrLoad: "Суретті ашу мүмкін болмады.",
    photoErrGeneric: "Суретті қосу мүмкін болмады.",
    locLede:
      "Орын автоматты түрде толтырылады. Белгі дұрыс емес жерге түссе, оны сүйреңіз немесе картаны басыңыз; терезеден немесе биіктен түсіргенде солай жиі болады.",
    locFinding: "Орныңыз анықталуда…",
    locDenied: "Орынға рұқсат берілмеді — белгіні оқиға болған жерге сүйреңіз.",
    locUnsupported: "Бұл браузер орынды хабарламайды — белгіні оқиға болған жерге сүйреңіз.",
    locDrag: "Орынды нақтылау үшін белгіні сүйреңіз немесе картаны басыңыз.",
    locPublished: (la, lo) => `${la}, ${lo} ретінде жарияланады — шамамен 1 км-ге дейін дөңгелектеніп.`,
    filedUnder: "Қала",
    selectCity: "Ең жақын қаланы таңдаңыз…",
    cityDerived: "Белгіге ең жақын қала. Хабарлама осы қала бойынша есептеледі.",
    cityManual: "Хабарлама картада және қалалар бойынша есепте осы қаламен көрсетіледі.",
    catLede: "Бұл қандай мәселе? Бес санат картадағы қабаттарға сәйкес келеді.",
    detailsLede: "Қаншалықты маңызды және не қосқыңыз келеді. Ескертпе міндетті емес.",
    severity: "Маңыздылық",
    noteLabel: "Ескертпе (міндетті емес)",
    notePlaceholder: "Не көрдіңіз? Иісі, түсі, қанша уақыттан бері тұр, неге әсер етті.",
    parentQuestion: "Бұл бұрынғы хабарламаларыңыздың бірінің жалғасы ма?",
    parentNone: "Жоқ — бұл жаңа хабарлама",
    parentPoints: (n) => `Тазалаудан немесе жауаптан кейінгі «кейін» фотосы +${n} Eco-Points береді.`,
    consentLegend: "Жібермес бұрын",
    consentPublicLead: "Көпшілікке, бәріне көрінеді:",
    consentPublic: "санат, маңыздылық, ескертпеңіз, қала, уақыт және шамамен 1 км-ге дейін дөңгелектенген картадағы нүкте.",
    consentPrivateLead: "Ешқайда жіберілмейді:",
    consentPrivate:
      "фото — ол осы браузерде қалады — және нақты нүкте. Аты-жөн, e-mail және телефон сұралмайды әрі сақталмайды.",
    consentRules:
      "Басқа адамдардың аты-жөнін, телефонын, көлік нөмірін және үй мекенжайын жазбаңыз. Кейін хабарламаны осы құрылғыдан жоюға болады.",
    consentCheck: "Хабарлама жоғарыда сипатталғандай жарияланатынын түсінемін.",
    consentDetails: "Толығырақ:",
    privacy: "құпиялылық саясаты",
    terms: "пайдалану шарттары",
    consentDrafts: "(заңгерлік тексерудегі жобалар).",
    rateHourly: "Жақын уақытқа жіберу шегі таусылды — енгізгеннің бәрі сақталды, сәлден кейін қайталаңыз.",
    rateDaily: "Күндік жіберу шегі таусылды — енгізгеннің бәрі сақталды, ертең қайталаңыз.",
    submitFailed: "Жіберу мүмкін болмады. Қайталап көріңіз.",
    cancel: "Бас тарту",
    back: "Артқа",
    cont: "Әрі қарай",
    submit: "Жіберу",
    submitting: "Жіберілуде…",
    backToFeed: "Лентаға оралу",
    autoTitle: (label, where) => `${label} · ${where}`,
    autoBody: (where) =>
      `«${where}» жерінен сипаттамасыз жіберілді. Санат пен маңыздылықты автор таңдады; басқа ештеңе көрсетілмеген.`,
    unspecified: "орын көрсетілмеген",
    fieldReport: "Хабарлама",
  },
  confirm: {
    statusLine: (gloss) => `${gloss} · ① мәртебе`,
    stored:
      "Хабарлама сақталды және енді картада әрі лентада бәріне көрінеді; орны шамамен 1 км-ге дейін дөңгелектенді. Фото болса, осы құрылғыда қалды.",
    local:
      "Ортақ дерекқор қолжетімсіз, сондықтан хабарлама тек осы браузерде сақталды — оны сіз көресіз, басқалар көрмейді. Ол жоғалған жоқ, бірақ ортақ лентаға да түскен жоқ.",
    nothingElse:
      "Онымен басқа ештеңе болған жоқ: оны ешкім тексерген жоқ, аспаптармен салыстырылған жоқ, ал Aetheris сипатталғанның рас не өтірік екенін мәлімдемейді.",
    nextTitle: "Әрі қарай не болуы мүмкін",
    next: (ai, city, corr) =>
      `Санатыңыз бен ауданыңыз үшін тірі дереккөз болса, Aetheris аналитигі қасына контекст ретінде ашық деректерді қояды — «${ai}». Егер 72 сағат ішінде басқа біреу басқа құрылғыдан ${city} қаласында сол санат бойынша хабарласа, екі хабарлама да «${corr}» мәртебесін алады — бұл тәуелсіз адамдар бір нәрсені сипаттағанын білдіреді, біреуіңіздің дұрыс екеніңізді емес.`,
    points: (n) => `Хабарлама үшін +${n} Eco-Points`,
    photoPoints: (n) => ` · фото үшін +${n}`,
    followPoints: (n) => ` · жалғасы үшін +${n}`,
  },
  badges: {
    ecoPoints: "Eco-Points",
    rank: "Атақ",
    writtenInConcept: (n) => `Community 2.0 тұжырымдамасында — «${n}».`,
    next: (n) => `Келесі · ${n}`,
    toGo: (n) => `${n} қалды`,
    zero: "Осы құрылғыдан әлі хабарлама жіберген жоқсыз, сондықтан мұнда нөл. Бұл біреу қойған баға емес: Eco-Points осы браузерде өз хабарламаларыңыз бойынша есептеледі, сайт деректерін тазалау оларды нөлдейді. Бұл прогресс көрсеткіші: оларды жұмсауға, беруге немесе бір нәрсеге айырбастауға болмайды, платформада ештеңе оларға байланысты емес.",
    rowFiled: (n) => `Хабарламалар · әрқайсысы ${n}`,
    rowCorroborated: (n) => `Басқалармен сәйкестік · әрқайсысы ${n}`,
    rowPhoto: (n) => `Фото сапасы · әрқайсысы ${n}`,
    rowFollow: (n) => `Жалғастар · әрқайсысы ${n}`,
    countedHere: "Осы браузерде өз хабарламаларыңыз бойынша есептеледі. Берілмейді, айырбасталмайды, ақшалай құны жоқ.",
    geoTitle: "Географиялық белгілер",
    thresholdNote: (n) =>
      `Community 2.0 тұжырымдамасы бұл белгі мен өңірді атайды, бірақ хабарлама санын көрсетпейді. ${n} шегін Aetheris Арал белгісіне ұқсатып белгіледі, оны өзгертуге болады — ол құжатта жоқ.`,
    ladder: "Атақтардың толық сатысы ▾",
    ladderNote:
      "«Бақылаушы», «Күзетші» және «Шоқжұлдыз» — платформада бұрыннан бар атаулар; «Далалық зерттеуші» мен «Экоинспектор» — Community 2.0 тұжырымдамасы олардың арасына қосатын екі атақ. Ұпай шектері — Aetheris-тің өзінікі: тұжырымдама ретті белгілейді, сандарды емес.",
    ranks: {
      Newcomer: "Жаңа келген",
      "Observer I": "Бақылаушы I",
      "Observer II": "Бақылаушы II",
      "Observer III": "Бақылаушы III",
      "Field Researcher": "Далалық зерттеуші",
      "Eco-Inspector": "Экоинспектор",
      "Sentinel I": "Күзетші I",
      "Sentinel II": "Күзетші II",
      "Sentinel III": "Күзетші III",
      Constellation: "Шоқжұлдыз",
    },
    geo: {
      almaty: { name: "Алматы зерттеушісі", gloss: "Алматы", where: "Алматы және Алматы облысы" },
      aral: { name: "Арал сақшылары", gloss: "Арал", where: "Арал теңізі алабы — Арал, Қызылорда" },
      industrial: { name: "Өнеркәсіп күзеті", gloss: "Өнеркәсіп белдеуі", where: "Теміртау — Қарағанды өнеркәсіп белдеуі" },
      balkhash: { name: "Балқаш сақшысы", gloss: "Балқаш", where: "Балқаш көлі алабы" },
      caspian: { name: "Каспий күзетшісі", gloss: "Каспий", where: "Каспий жағалауы — Атырау, Ақтау, Жаңаөзен" },
    },
  },
  events: {
    title: "Жергілікті экоіс-шаралар",
    scheduled: (n) => `жоспарланған: ${n}`,
    create: "Құру",
    none: "Әзірге іс-шаралар жоқ. Кез келген адам қоса алады — тазалау, зерттеу, картаға түсіру серуені, — ал басқалар жазылып, орнында белгілене алады.",
    unreachable:
      "Іс-шаралар дерекқоры бұл жерден қолжетімсіз, сондықтан қазір нақты іс-шараларды көрсету де, құру да мүмкін емес. Төменде — осы бетте бұрыннан тұрған мысалдар.",
    sampleNote:
      "Қатысушылар саны ойдан шығарылған мысалдар, бұл бөлімнің не үшін екенін көрсету үшін бұрынғы статикалық блоктан қалдырылған. Бұлар жоспарланған кездесулер емес: оларға жазылу жоқ, оларға ешкім бармайды.",
    sampleTitle: "Мысал — жоспарланған кездесу емес.",
    attendingSample: (n) => `${n} қатысушы (мысал)`,
    yours: "Сіздікі",
    going: (n) => `барады: ${n}`,
    goingCapped: (n, c) => `барады: ${n}/${c}`,
    checkedInCount: (n) => ` · белгіленді: ${n}`,
    rsvp: "Жазылу",
    rsvpGoing: "Барамын ✓",
    full: "Орын жоқ",
    checkedIn: "Белгіленді ✓",
    checkIn: "Белгілену",
    notOpen: "Белгілену әлі ашылмаған",
    closed: "Белгілену жабылды",
    hintEarly: "Белгілену басталуына бір сағат қалғанда ашылады.",
    hintClosed: "Белгілену басталғаннан кейін төрт сағаттан соң жабылды.",
    hintOpen: (m) => `Қашықтықты өлшеу үшін орныңызды бір рет пайдаланады — іс-шарадан ${m} м-ден алыс болмауыңыз керек. Координаттар сақталмайды.`,
    errRsvp: "Жазылуды өзгерту мүмкін болмады — іс-шаралар дерекқоры жауап бермеді.",
    errFull: "Бұл іс-шараға орын қалмады.",
    errNoGeo: "Бұл браузер орынды хабарламайды, сондықтан белгілену мүмкін емес.",
    okCheckedIn: (t) => `Белгілендіңіз: ${t}.`,
    errTooFar: (m) => `Іс-шара орнынан ${m} м-ден алыссыз, сондықтан белгілену есептелмеді.`,
    errTooEarly: "Белгілену іс-шара басталуына бір сағат қалғанда ашылады.",
    errClosed: "Белгілену іс-шара басталғаннан кейін төрт сағаттан соң жабылды.",
    errCheckin: "Белгілену мүмкін болмады.",
    errPermission: "Іс-шарада белгілену үшін орынға рұқсат қажет.",
    formKicker: "Ұйымдастыру",
    formTitle: "Жаңа іс-шара",
    formClose: "Іс-шара формасын жабу",
    fTitle: "Атауы",
    fTitlePh: "мыс. Іле Алатауы бөктерін тазалау",
    fDesc: "Бұл не",
    fDescPh: "Не істейсіздер, өзімен не алу керек, нақты қай жерде кездесеміз?",
    fStarts: "Басталуы",
    fCap: "Қатысушылар шегі (міндетті емес)",
    fCapPh: "Шексіз",
    fArea: "Аудан",
    fPin: (m) => `Белгіні кездесу орнына сүйреңіз. Белгілену одан ${m} м радиуста ғана жұмыс істейді.`,
    errRate: "Тәулік ішінде үш іс-шара құрдыңыз — әзірге шегі осы.",
    errPast: "Бұл басталу уақыты өтіп кеткен.",
    errCreate: "Іс-шараны құру мүмкін болмады — дерекқор оны қабылдамады.",
    creating: "Құрылуда…",
    createEvent: "Іс-шара құру",
    cancel: "Бас тарту",
    months: ["ҚАҢ", "АҚП", "НАУ", "СӘУ", "МАМ", "МАУ", "ШІЛ", "ТАМ", "ҚЫР", "ҚАЗ", "ҚАР", "ЖЕЛ"],
    samples: {
      "sample-ile-alatau": { title: "Іле Алатауы бөктерін тазалау", place: "Алматы" },
      "sample-heat-island": { title: "«Жылу аралын» картаға түсіру серуені", place: "Астана" },
      "sample-balkhash": { title: "Балқаш жағалауын зерттеу", place: "Балқаш" },
    },
  },
  ai: {
    airAt: (c) => `${c} үшін Open-Meteo ауа сапасы мәні (CAMS моделі)`,
    airNear: (c, km) => `Ашық деректері бар ең жақын қала (${c}, ${km} км)`,
    airText: (where, aqi, band, pm25, no2, industrial) =>
      `${where} қазір US AQI ${aqi} (${band}), PM2.5 ${pm25} мкг/м³ және NO₂ ${no2} ppb көрсетеді. ` +
      `Бұл хабарламаны тексеру емес, маңайға арналған модельдік бағалау: ` +
      `бұл дәл сол нүктедегі өлшеу емес және онда көрінгеннен өзгеше болуы мүмкін; ` +
      `${industrial ? "көрінгеннің көзі" : "оның себебі"} туралы да ештеңе айтпайды.`,
    airSource: (c, at) => `Open-Meteo Air Quality API (CAMS моделі) · ${c} · алынды ${at}`,
    bioText: (km, city, records, species, years, from, to) =>
      `${city} қаласынан ${km} км радиуста GBIF-те кездесу туралы ${records} жазба бар, бұл соңғы ${years} жылдағы ` +
      `${species} түр (${from}–${to}). ` +
      `Бұл адамдардың осы аудан туралы жариялағанының жазбасы, сондықтан ол мұнда қанша бақылау жүргізілгенін де, ` +
      `мұнда кім тіршілік ететінін де көрсетеді. Бұл хабарламаны оқуға арналған фон, оны тексеру емес.`,
    bioSource: (km, from, to) => `GBIF кездесу іздеуі · ${km} км радиус · ${from}–${to}`,
    water:
      "Қазақстан бойынша қажетті егжей-тегжейлі су сапасының тірі дереккөзі табылған жоқ, сондықтан хабарламаның қасына аспаптан ештеңе қоюға болмайды. Платформаның басқа бөлімдеріндегі су сапасы индексі өлшенген емес, модельдік, және мұнда модельдік санды келтіру болмаған тексеруді меңзейтін еді.",
    waste:
      "Қалдықтар мен қоқыс үйінділері бойынша тірі дереккөз жоқ — оларды ешбір аспаптар желісі өлшемейді. Бұл хабарламаның қасына сол аудандағы басқа адамдардың хабарламаларынан басқа ештеңе қоюға болмайды.",
    noneSource: "Aetheris аналитигі · бұл санат үшін тірі дереккөз жоқ",
  },
  seeds: {
    "seed-almaty-smog": {
      author: "Айгерім Қ.",
      city: "Алматы · Бостандық ауданы",
      time: "22 мин бұрын",
      title: "Таңғы инверсиядан кейінгі қою түтін қабаты",
      body: "Оңтүстік аудандардың үстінде бөктерге қарай сұр жолақ тұр. Көрінім күрт төмендеді; менің қол құралым жергілікті уақытпен 08:10-да PM2.5 шамамен 140 мкг/м³ көрсетті.",
    },
    "seed-karaganda-haze": {
      author: "Нұрлан Т.",
      city: "Қарағанды · өнеркәсіп ауданы",
      time: "48 мин бұрын",
      title: "Теміртау — Қарағанды белдеуі үстіндегі тұрақты мұнар",
      body: "Қоңыр түтін таң бойы төмен тұр, айналма жол маңында күкірттің қатты иісі бар. Көрінім кешегіден айтарлықтай нашар.",
    },
    "seed-karaganda-dust": {
      author: "Салтанат Б.",
      city: "Қарағанды · өнеркәсіп ауданы",
      time: "3 сағ бұрын",
      title: "Айналма жол маңындағы көліктерге сұр шаң қонуда",
      body: "Сәскеге қарай көшеміздегі әр тұрған көлікте жұқа сұр қабат, қатарынан екінші күн. Зауыт жағында сол қоңыр қабат көрінеді.",
    },
    "seed-atyrau-sheen": {
      author: "Данияр С.",
      city: "Атырау · Жайық сағасы",
      time: "1 сағ бұрын",
      title: "Жағалау бойымен мұнай қабыршағы жайылуда",
      body: "Кемпірқосақ түсті қабыршақ өнеркәсіптік ағызудан шамамен 200 м төмен созылып жатыр. Сынама № ATY-07 жинағымен жазылды; тәуелсіз зертханалық тексеруді сұраймын.",
    },
    "seed-aktau-caspian": {
      author: "Зарина М.",
      city: "Ақтау · Каспий жағалауы",
      time: "2 сағ бұрын",
      title: "Каспий жағалауы бойындағы түсі өзгерген көбік",
      body: "Су жинағыш маңындағы шамамен 150 м жағажайда сарғыш көбік және химиялық иіс. Итбалықтарды бақылайтын еріктілерге хабарланды.",
    },
    "seed-shymkent-dumping": {
      author: "Бекзат А.",
      city: "Шымкент · Бадам каналы",
      time: "4 сағ бұрын",
      title: "Канал бойындағы заңсыз қоқыс үйіндісі ұлғаюда",
      body: "Құрылыс қоқысы мен тұрмыстық қалдықтар жағадан, ішінара суға төгілген. Осы айда үшінші рет — әкімдікке жеткізуді сұраймын.",
    },
    "seed-burabay-flamingo": {
      author: "Мадина Т.",
      city: "Көкшетау · Бурабай",
      time: "5 сағ бұрын",
      title: "Қоқиқаз тобы көлге әдеттегіден ерте оралды",
      body: "Солтүстік таяздықта қырыққа жуық құс — 10 жылдық медианадан сегіз күн ерте. Көші-қон трекеріне жазылды.",
    },
  },
};

const ALL: Record<Locale, CommunityText> = { en, ru, kk };

export function communityText(locale: Locale): CommunityText {
  return ALL[locale];
}

/** A station name (as stored with a report) in the reader's language. */
export function placeName(name: string, locale: Locale, stationIdByName: Map<string, string>): string {
  if (locale === "en") return name;
  const id = stationIdByName.get(name);
  return (id && CITY_NAMES[id]?.[locale]) || name;
}

/** Relative time in the reader's language ("3 h ago", "3 ч назад"). */
export function relativeTimeIn(ts: number, t: CommunityText["time"]): string {
  const s = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  if (s < 45) return t.now;
  if (s < 3600) return t.min(Math.floor(s / 60));
  if (s < 86400) return t.h(Math.floor(s / 3600));
  return t.d(Math.floor(s / 86400));
}
