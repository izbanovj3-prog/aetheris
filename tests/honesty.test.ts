import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { generate } from "@/lib/ai";
import { buildEvents } from "@/lib/atlas";
import { getPageContent } from "@/lib/content";
import { getDict, LOCALES } from "@/lib/i18n";
import { getLegal } from "@/lib/legal";
import { originOf } from "@/lib/data";
import { SITE } from "@/lib/site";

/* ─────────────────────────────────────────────────────────────
   Data honesty, as a test.

   Water, industrial pollution, biodiversity and risk on this site are
   modelled; air quality is open data (itself the CAMS model) only once it
   has been fetched; the assistant answers entirely from the simulation.
   The copy used to say otherwise in many places — "real-time", "sensor
   network", "station cluster · live", invented Aral/Balkhash percentages,
   an ingest rate. This file keeps those from coming back.
   ───────────────────────────────────────────────────────────── */

/** Honest negations that legitimately contain a forbidden word. */
const ALLOWED = [
  /no free real-time point feed/gi,
  /not a real-time sensor feed/gi,
  /бесплатного потока в реальном времени для них пока нет/gi,
  /тегін нақты уақыт ағыны әлі жоқ/gi,
  /real-time\s+water sensor ingestion/gi, // listed as "not yet built"
  /no free real-time source/gi,
  /тегін нақты уақыт дереккөзі мүлдем табылған жоқ/gi,
  // A recommendation to industry, not a claim about this site:
  /public real-time readings cut unreported exceedances/gi,
  /публичные данные в реальном времени/gi,
  /нақты уақыттағы ашық деректер/gi,
];

const FORBIDDEN: Array<[RegExp, string]> = [
  [/real[- ]time|в реальном времени|нақты уақыт/i, "real-time claim"],
  [/sensor network|сет[ьи] сенсоров|сенсорлар желісі/i, "sensor network"],
  [/station cluster|кластер станций|станциялар кластері/i, "station cluster"],
  [/stations reporting|станций на связи|станциясы байланыста/i, "stations reporting"],
  [/monitoring network|сети мониторинга|мониторинг желісі/i, "monitoring network"],
  [/planetary network|сеть · live|желі · live/i, "network · live"],
  [/sensor sweep|проход сети|желі өтуі/i, "sensor sweep"],
  [/Aetheris Systems/i, "a company that does not exist"],
  [/ingest rate|скорость приёма|қабылдау жылдамдығы/i, "invented pipeline metric"],
  [/people verify|люди подтверждают|адамдар растайды/i, "verification nobody does"],
  [/cross-checked against sensor|сверяются с данными сенсоров|сенсор деректерімен салыстырылып/i, "sensor cross-check"],
];

function scrub(text: string) {
  return ALLOWED.reduce((t, re) => t.replace(re, ""), text);
}

const sources: Array<[string, string]> = [
  ["lib/site.ts SITE", JSON.stringify(SITE)],
  ...LOCALES.flatMap((l) => [
    [`dict ${l}`, JSON.stringify(getDict(l), (_k, v) => (typeof v === "function" ? String(v) : v))],
    [`content ${l}`, JSON.stringify(getPageContent(l))],
    [`legal ${l}`, JSON.stringify(getLegal(l))],
    [`atlas feed ${l}`, JSON.stringify(buildEvents(l))],
  ] as Array<[string, string]>),
  ["lib/ai.ts", readFileSync(join(process.cwd(), "lib", "ai.ts"), "utf8")],
  ...["app/ru", "app/kk"].map(
    (d) => [`${d} og alt`, readFileSync(join(process.cwd(), d, "opengraph-image.alt.txt"), "utf8")] as [string, string],
  ),
];

describe("no copy claims more than the data is", () => {
  for (const [name, text] of sources) {
    it(`${name}`, () => {
      const t = scrub(text);
      for (const [re, what] of FORBIDDEN) {
        const m = re.exec(t);
        expect(m, `${name}: ${what} — "…${m ? t.slice(Math.max(0, m.index - 60), m.index + 60) : ""}…"`).toBeNull();
      }
    });
  }
});

describe("the modelled overview on the map", () => {
  it.each(LOCALES)("states no invented percentages (%s)", (l) => {
    for (const e of buildEvents(l)) expect(e.text, e.text).not.toMatch(/%/);
  });
});

describe("the assistant", () => {
  const WITH_FIGURES: Record<string, string[]> = {
    en: ["National summary", "How is Almaty doing?", "Risk outlook for Aralsk", "Recommendations for Temirtau", "Industrial hotspots"],
    ru: ["Национальная сводка", "Как дела в Алматы?", "Прогноз рисков для Аральска", "Рекомендации для Темиртау", "Промышленные горячие точки"],
    kk: ["Ұлттық сводка", "Алматы қалай?", "Арал бойынша тәуекел болжамы", "Теміртау үшін ұсыныстар", "Өнеркәсіптік ошақтар"],
  };
  const NOTICE = { en: /^> \*\*Modelled estimates, not measurements\.\*\*/, ru: /^> \*\*Модельные оценки, а не измерения\.\*\*/, kk: /^> \*\*Өлшеу емес, модельдік бағалаулар\.\*\*/ };

  for (const l of LOCALES) {
    it.each(WITH_FIGURES[l])(`opens every answer with figures with the model notice (${l}): %s`, (q) => {
      const r = generate(q, l);
      expect(r.text).toMatch(/\d/);
      expect(r.text).toMatch(NOTICE[l]);
    });

    it(`never cites a live source for modelled figures (${l})`, () => {
      for (const q of WITH_FIGURES[l]) {
        for (const c of generate(q, l).citations) {
          expect(c, c).not.toMatch(/·\s*live\b/i);
          // A feed may be named only when the citation says it is simulated
          // or not used in this answer.
          if (/feed|поток|ағын|Open-Meteo/i.test(c)) {
            expect(c, c).toMatch(/simulated|симуляц|not used|не используется|қолданылмайды/i);
          }
        }
      }
    });
  }
});

describe("the assistant finds inflected place names", () => {
  it.each([
    ["Прогноз рисков для Аральска", "ru", "Аральск"],
    ["Качество воздуха в Караганде", "ru", "Караганд"],
    ["Как дела в Шымкенте?", "ru", "Шымкент"],
    ["Алматыда ауа қалай?", "kk", "Алматы"],
  ] as const)("%s", (q, l, name) => {
    const r = generate(q, l);
    expect(r.text).toContain(name);
    expect(r.text).toMatch(/Модельн|модельдік/);
  });
});

describe("Live badges", () => {
  it("only mark air values live when the reading actually arrived", () => {
    expect(originOf("aqi", true)).toBe("live");
    expect(originOf("aqi", false)).toBe("modeled");
    expect(originOf("pm25", false)).toBe("modeled");
    expect(originOf("waterQuality", true)).toBe("modeled");
  });
});
