import { describe, expect, it } from "vitest";
import { communityText } from "@/lib/communityText";
import { LOCALES } from "@/lib/i18n";
import { GEO_BADGES, RANKS } from "@/lib/points";
import { SEED_REPORTS, STATUS_ORDER } from "@/lib/reports";
import { SAMPLE_EVENTS } from "@/lib/events";

/* The community page in three languages. The structural checks catch a
   string added in English and forgotten elsewhere; the wording check holds
   every language to the rule the status vocabulary was built on. */

function shape(v: unknown): unknown {
  if (typeof v === "function") return "fn";
  if (Array.isArray(v)) return v.map(shape);
  if (v && typeof v === "object")
    return Object.fromEntries(Object.keys(v).sort().map((k) => [k, shape((v as Record<string, unknown>)[k])]));
  return typeof v;
}

const strip = (t: ReturnType<typeof communityText>) => ({ ...t, seeds: {}, badges: { ...t.badges, ranks: {}, geo: {} }, events: { ...t.events, samples: {} } });

describe("community text", () => {
  it.each(["ru", "kk"] as const)("%s has every key English has", (l) => {
    expect(shape(strip(communityText(l)))).toEqual(shape(strip(communityText("en"))));
  });

  it.each(["ru", "kk"] as const)("%s translates every seeded example, rank, badge and sample event", (l) => {
    const t = communityText(l);
    for (const r of SEED_REPORTS) {
      expect(t.seeds[r.id]?.title, r.id).toBeTruthy();
      expect(t.seeds[r.id]?.body, r.id).toBeTruthy();
    }
    for (const r of RANKS) expect(t.badges.ranks[r.name], r.name).toBeTruthy();
    for (const b of GEO_BADGES) expect(t.badges.geo[b.id]?.where, b.id).toBeTruthy();
    for (const e of SAMPLE_EVENTS) expect(t.events.samples[e.id]?.title, e.id).toBeTruthy();
    expect(t.events.months).toHaveLength(12);
  });

  /* No language may claim a report was verified, confirmed or resolved —
     in a status, its gloss, the toast or the confirmation screen. The
     legend is excluded on purpose: it names those words to say they do
     not exist. */
  const forbidden = /verified|confirmed|resolved|подтвержд|проверено|решено|расталды|тексерілді|шешілді/i;
  it.each(LOCALES)("%s never claims a report was checked", (l) => {
    const t = communityText(l);
    for (const s of STATUS_ORDER) {
      expect(t.statuses[s].label, `${l} ${s}`).not.toMatch(forbidden);
      expect(t.statuses[s].gloss, `${l} ${s}`).not.toMatch(forbidden);
    }
    for (const v of [t.confirm.stored, t.confirm.local, t.confirm.nothingElse, t.page.toastFiled, t.page.toastSub, t.flow.titleFiled]) {
      expect(v).not.toMatch(forbidden);
    }
  });

  it.each(LOCALES)("%s calls the open-data value a model estimate, not a station reading", (l) => {
    const t = communityText(l).ai;
    const text = t.airText(t.airAt("X"), 100, "Moderate", 30, 20, false);
    expect(text).toMatch(/model estimate|модельная оценка|модельдік бағалау/);
    expect(text).not.toMatch(/\bstation\b|станци/i);
  });
});
