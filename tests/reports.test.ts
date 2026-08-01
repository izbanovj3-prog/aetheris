import { describe, expect, it } from "vitest";
import {
  SEED_REPORTS,
  STATUS_META,
  STATUS_ORDER,
  namesOrganisation,
  relativeTime,
  resolveStatus,
  statusFromRemote,
  type Report,
  type ReportStatus,
} from "@/lib/reports";

function report(over: Partial<Report> = {}): Report {
  return {
    id: "r-1",
    author: "You",
    initials: "YOU",
    city: "Almaty",
    category: "air",
    severity: "low",
    title: "t",
    body: "b",
    status: "submitted",
    upvotes: 0,
    comments: 0,
    ...over,
  };
}

describe("the status vocabulary", () => {
  it("has exactly the five statuses, in order", () => {
    expect(STATUS_ORDER).toEqual([
      "submitted",
      "ai-context",
      "corroborated",
      "forwarded",
      "org-response",
    ]);
    expect(STATUS_ORDER.map((s) => STATUS_META[s].step)).toEqual([1, 2, 3, 4, 5]);
  });

  it("uses the concept's own names", () => {
    expect(STATUS_ORDER.map((s) => STATUS_META[s].label)).toEqual([
      "Отправлен",
      "AI-контекст добавлен",
      "Corroborated сообществом",
      "Передано в акимат/эко-инспекцию",
      "Ответ организации",
    ]);
  });

  /* The platform has no moderators, no instrument check behind a field
     report and no legal responsibility for verification, so no status may
     print a word claiming any of the three. The chip labels and their
     English glosses are what a reader actually sees, so they are what is
     asserted; the explanatory notes are allowed to say "not verification",
     which is a denial rather than a claim. */
  it("never claims a report is verified, confirmed or resolved", () => {
    const forbidden = /verified|confirmed|resolved|solved|подтвержд|проверено|решено/i;
    for (const s of STATUS_ORDER) {
      expect(STATUS_META[s].label, `label of ${s}`).not.toMatch(forbidden);
      expect(STATUS_META[s].gloss, `gloss of ${s}`).not.toMatch(forbidden);
    }
  });

  it("gives every status a gloss and an explanation", () => {
    for (const s of STATUS_ORDER) {
      expect(STATUS_META[s].gloss.length).toBeGreaterThan(0);
      expect(STATUS_META[s].note.length).toBeGreaterThan(40);
    }
  });
});

describe("statusFromRemote", () => {
  it("passes the current vocabulary through", () => {
    expect(statusFromRemote("submitted")).toBe("submitted");
    expect(statusFromRemote("corroborated")).toBe("corroborated");
    expect(statusFromRemote("forwarded")).toBe("forwarded");
    expect(statusFromRemote("org-response")).toBe("org-response");
  });

  it("maps the pre-2.0 values so an unmigrated database still renders", () => {
    expect(statusFromRemote("pending")).toBe("submitted");
    expect(statusFromRemote("cross-checking")).toBe("corroborated");
  });

  /* Legacy "verified" becomes "submitted", never "corroborated". Nothing in
     the old system ever set it — inserts were forced to 'pending' and the
     trigger only wrote 'cross-checking' — so a row holding it carries no
     corroboration evidence and must not be promoted into a claim. */
  it("demotes legacy 'verified' rather than promoting them", () => {
    expect(statusFromRemote("verified")).toBe("submitted");
  });

  it("falls back to the weakest status for anything unrecognised", () => {
    expect(statusFromRemote("something-new")).toBe("submitted");
    expect(statusFromRemote(null)).toBe("submitted");
    expect(statusFromRemote(undefined)).toBe("submitted");
  });
});

describe("resolveStatus", () => {
  it("shows ② only once real context has resolved", () => {
    expect(resolveStatus(report(), false)).toBe("submitted");
    expect(resolveStatus(report(), true)).toBe("ai-context");
  });

  /* A corroborated or forwarded report must not walk backwards to ② just
     because its context bubble happened to load. */
  it.each<ReportStatus>(["corroborated", "forwarded", "org-response"])(
    "keeps the later status %s when context arrives",
    (status) => {
      expect(resolveStatus(report({ status }), true)).toBe(status);
    },
  );
});

describe("the seeded feed", () => {
  it("only ever uses ① and ③", () => {
    const used = new Set(SEED_REPORTS.map((r) => r.status));
    expect([...used].sort()).toEqual(["corroborated", "submitted"]);
  });

  /* Marking a sample report as forwarded to a public body, or as having
     drawn a reply from one, would be inventing traction the project does
     not have. */
  it("never claims a sample was forwarded or answered", () => {
    for (const r of SEED_REPORTS) {
      expect(r.forwardedAt ?? null).toBeNull();
      expect(r.orgResponse ?? null).toBeNull();
    }
  });

  /* Corroboration needs two different devices reporting the same category
     in the same city. A lone ③ in the sample feed would be asserting a
     status the rule could not have produced. */
  it("backs every corroborated sample with a second, different reporter", () => {
    const corroborated = SEED_REPORTS.filter((r) => r.status === "corroborated");
    expect(corroborated.length).toBeGreaterThan(0);
    for (const r of corroborated) {
      const peers = SEED_REPORTS.filter(
        (o) => o.city === r.city && o.category === r.category && o.author !== r.author,
      );
      expect(peers.length, `${r.title} has no corroborating peer`).toBeGreaterThan(0);
    }
  });

  it("gives every seed coordinates, so the AI context can locate it", () => {
    for (const r of SEED_REPORTS) {
      expect(typeof r.lat, r.title).toBe("number");
      expect(typeof r.lon, r.title).toBe("number");
    }
  });
});

describe("namesOrganisation", () => {
  it.each([
    ["Kazhydromet"],
    ["казгидромет"],
    ["Қазгидромет"],
    ["the akimat was notified"],
    ["акимат"],
    ["ArcelorMittal"],
    ["LLP Northern Mining"],
  ])("flags %s so the independence disclaimer renders", (text) => {
    expect(namesOrganisation({ title: "t", body: text })).toBe(true);
  });

  /* These three are the corporate forms that actually appear in reports
     written in Russian and Kazakh, and none of them matched: the pattern
     used \b, which in JavaScript is defined against ASCII \w and cannot
     sit against a Cyrillic letter. The watchlist was covering only the
     Latin half of its own list. */
  it.each([
    ["ТОО КазМунайГаз"],
    ["АО Банк развития"],
    ["ЖШС Компания"],
    ["сброс от ТОО, вышка рядом"],
    ["владелец — ТОО"],
  ])("flags the Cyrillic corporate form in %s", (text) => {
    expect(namesOrganisation({ title: "t", body: text })).toBe(true);
  });

  it("does not fire on a word that merely contains those letters", () => {
    expect(namesOrganisation({ title: "t", body: "заоблачный дым" })).toBe(false);
    expect(namesOrganisation({ title: "t", body: "тооле би" })).toBe(false);
  });

  it("checks the title as well as the body", () => {
    expect(namesOrganisation({ title: "Kazhydromet station", body: "b" })).toBe(true);
  });

  it("leaves an ordinary report alone", () => {
    expect(
      namesOrganisation({ title: "Smog over the foothills", body: "Grey band, low visibility." }),
    ).toBe(false);
  });

  /* "Ural delta" is a place, not an organisation — the watchlist is
     explicit precisely so capitalisation heuristics cannot tag places. */
  it("does not mistake a place name for an organisation", () => {
    expect(namesOrganisation({ title: "Oil sheen", body: "Along the Ural delta." })).toBe(false);
  });
});

describe("relativeTime", () => {
  const now = Date.now();
  it("reads as just now inside the first minute", () => {
    expect(relativeTime(now - 5_000)).toBe("just now");
  });
  it("counts minutes, hours and days", () => {
    expect(relativeTime(now - 5 * 60_000)).toBe("5 min ago");
    expect(relativeTime(now - 3 * 3_600_000)).toBe("3 h ago");
    expect(relativeTime(now - 2 * 86_400_000)).toBe("2 d ago");
  });
  it("does not render a future timestamp as negative", () => {
    expect(relativeTime(now + 60_000)).toBe("just now");
  });
});
