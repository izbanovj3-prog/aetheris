import { describe, expect, it } from "vitest";
import {
  GEO_BADGES,
  POINTS,
  RANKS,
  badgeProgress,
  computePoints,
  rankFor,
} from "@/lib/points";
import type { Report, ReportStatus } from "@/lib/reports";

/* Eco-Points, ranks and geographic badges.

   The point values are fixed by the Community 2.0 concept, and the +25 in
   particular is the number already printed on the report card. A silent
   drift here changes what contributors are told they earned and nothing
   on screen looks wrong, which is exactly why it is worth pinning. */

let n = 0;
function report(over: Partial<Report> = {}): Report {
  n += 1;
  return {
    id: `r-${n}`,
    author: "You",
    initials: "YOU",
    city: "Almaty",
    category: "air",
    severity: "low",
    title: `report ${n}`,
    body: "body",
    status: "submitted",
    upvotes: 0,
    comments: 0,
    ...over,
  };
}

describe("point values match the concept", () => {
  it("keeps the four documented amounts", () => {
    expect(POINTS).toEqual({
      submission: 10,
      corroboration: 25,
      photoQuality: 5,
      followUp: 15,
    });
  });
});

describe("computePoints", () => {
  it("scores an empty history as zero rather than guessing", () => {
    expect(computePoints([])).toEqual({
      total: 0,
      reports: 0,
      submission: 0,
      corroboration: 0,
      photoQuality: 0,
      followUp: 0,
    });
  });

  it("awards the submission value per report", () => {
    const p = computePoints([report(), report(), report()]);
    expect(p.reports).toBe(3);
    expect(p.submission).toBe(30);
    expect(p.total).toBe(30);
  });

  it("stacks every bonus a single report can earn", () => {
    const p = computePoints([
      report({ status: "corroborated", photoQuality: true, parentId: "r-parent" }),
    ]);
    expect(p).toMatchObject({
      submission: 10,
      corroboration: 25,
      photoQuality: 5,
      followUp: 15,
      total: 55,
    });
  });

  /* ④ and ⑤ overwrite ③ in the database. Checking only for "corroborated"
     would take 25 points back off someone the moment their report was
     forwarded to a public body — a silent penalty for the report doing
     better, and invisible unless asserted. */
  it.each<ReportStatus>(["corroborated", "forwarded", "org-response"])(
    "keeps the corroboration bonus at status %s",
    (status) => {
      expect(computePoints([report({ status })]).corroboration).toBe(25);
    },
  );

  it("gives no corroboration bonus at the two earlier statuses", () => {
    expect(computePoints([report({ status: "submitted" })]).corroboration).toBe(0);
    expect(computePoints([report({ status: "ai-context" })]).corroboration).toBe(0);
  });

  it("does not pay the photo bonus for a photo that failed the check", () => {
    expect(computePoints([report({ photoQuality: false })]).photoQuality).toBe(0);
  });
});

describe("rankFor", () => {
  it("starts at the entry rank on zero points", () => {
    expect(rankFor(0).rank.name).toBe("Newcomer");
  });

  /* The entry rank is the only rung the concept writes in Russian, and it
     is shown in English with the concept's word in a tooltip. Both halves
     of that decision are asserted so neither can drift alone. */
  it("carries the concept's own name for the entry rank", () => {
    expect(RANKS[0].docName).toBe("Новичок");
    expect(RANKS.slice(1).every((r) => r.docName === undefined)).toBe(true);
  });

  it("promotes exactly at a threshold, not one point later", () => {
    expect(rankFor(9).rank.name).toBe("Newcomer");
    expect(rankFor(10).rank.name).toBe("Observer I");
  });

  it("reports the gap to the next rank", () => {
    const r = rankFor(10);
    expect(r.next?.name).toBe("Observer II");
    expect(r.toNext).toBe(40);
  });

  it("tops out without a next rank or an overflowing progress bar", () => {
    const top = rankFor(999_999);
    expect(top.rank.name).toBe("Constellation");
    expect(top.next).toBeNull();
    expect(top.progress).toBe(1);
    expect(top.toNext).toBe(0);
  });

  it("keeps progress inside 0..1 across the whole ladder", () => {
    for (let pts = 0; pts <= 2200; pts += 7) {
      const { progress } = rankFor(pts);
      expect(progress).toBeGreaterThanOrEqual(0);
      expect(progress).toBeLessThanOrEqual(1);
    }
  });

  it("keeps the ladder strictly ascending", () => {
    for (let i = 1; i < RANKS.length; i += 1) {
      expect(RANKS[i].at).toBeGreaterThan(RANKS[i - 1].at);
    }
  });

  /* The concept reuses names already live on the site rather than running a
     second progression beside them. */
  it("reuses the existing rank names and the concept's two new ones", () => {
    const names = RANKS.map((r) => r.name);
    expect(names).toContain("Observer I");
    expect(names).toContain("Sentinel III");
    expect(names).toContain("Constellation");
    expect(names).toContain("Field Researcher");
    expect(names).toContain("Eco-Inspector");
  });
});

describe("geographic badges", () => {
  it("defines the five badges from the concept, under its own names", () => {
    expect(GEO_BADGES.map((b) => b.name)).toEqual([
      "Исследователь Алматы",
      "Стражи Арала",
      "Индустриальный дозор",
      "Хранитель Балхаша",
      "Каспийский дозорный",
    ]);
  });

  /* The concept states a count for two of the five only. The other three
     are ours, and the flag is what keeps that visible in the UI — if a
     threshold is ever sourced from the document, this is where it changes. */
  it("marks which thresholds came from the concept", () => {
    const fromDoc = GEO_BADGES.filter((b) => b.thresholdFromDoc);
    expect(fromDoc.map((b) => [b.name, b.threshold])).toEqual([
      ["Исследователь Алматы", 10],
      ["Стражи Арала", 5],
    ]);
  });

  it("does not award a badge before its threshold", () => {
    const nine = Array.from({ length: 9 }, () => report({ city: "Almaty" }));
    const almaty = badgeProgress(nine).find((b) => b.badge.id === "almaty")!;
    expect(almaty.count).toBe(9);
    expect(almaty.earned).toBe(false);
    expect(almaty.progress).toBeCloseTo(0.9);
  });

  it("awards it on the threshold report", () => {
    const ten = Array.from({ length: 10 }, () => report({ city: "Almaty" }));
    expect(badgeProgress(ten).find((b) => b.badge.id === "almaty")!.earned).toBe(true);
  });

  /* The seeded feed writes district suffixes ("Almaty · Bostandyk") that the
     live submission flow does not. Both have to count, or a badge silently
     stops progressing depending on which path filed the report. */
  it("counts a city label carrying a district suffix", () => {
    const mixed = [report({ city: "Almaty" }), report({ city: "Almaty · Bostandyk" })];
    expect(badgeProgress(mixed).find((b) => b.badge.id === "almaty")!.count).toBe(2);
  });

  it("does not match a different city that merely starts the same way", () => {
    const other = [report({ city: "Almatyville" })];
    expect(badgeProgress(other).find((b) => b.badge.id === "almaty")!.count).toBe(0);
  });

  it("counts every city belonging to a multi-city badge", () => {
    const caspian = [
      report({ city: "Atyrau" }),
      report({ city: "Aktau" }),
      report({ city: "Zhanaozen" }),
    ];
    expect(badgeProgress(caspian).find((b) => b.badge.id === "caspian")!.count).toBe(3);
  });

  it("caps progress at 1 once the threshold is passed", () => {
    const many = Array.from({ length: 40 }, () => report({ city: "Balkhash" }));
    expect(badgeProgress(many).find((b) => b.badge.id === "balkhash")!.progress).toBe(1);
  });
});
