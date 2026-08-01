import { afterEach, describe, expect, it, vi } from "vitest";
import {
  CHECKIN_RADIUS_M,
  SAMPLE_EVENTS,
  checkinWindow,
  eventClock,
  eventDay,
} from "@/lib/events";

afterEach(() => {
  vi.useRealTimers();
});

/** Freeze the clock at a fixed instant so the window maths is deterministic. */
function at(iso: string) {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(iso));
}

describe("checkinWindow", () => {
  const start = "2026-09-01T09:00:00.000Z";

  it("is closed well before the event", () => {
    at("2026-09-01T06:00:00.000Z");
    expect(checkinWindow(new Date(start).getTime())).toBe("early");
  });

  it("opens exactly an hour before the start", () => {
    at("2026-09-01T08:00:00.000Z");
    expect(checkinWindow(new Date(start).getTime())).toBe("open");
  });

  it("is still shut a minute earlier", () => {
    at("2026-09-01T07:59:00.000Z");
    expect(checkinWindow(new Date(start).getTime())).toBe("early");
  });

  it("is open during the event", () => {
    at("2026-09-01T09:30:00.000Z");
    expect(checkinWindow(new Date(start).getTime())).toBe("open");
  });

  it("closes four hours after the start", () => {
    at("2026-09-01T13:01:00.000Z");
    expect(checkinWindow(new Date(start).getTime())).toBe("closed");
  });

  it("is still open at the four-hour mark itself", () => {
    at("2026-09-01T13:00:00.000Z");
    expect(checkinWindow(new Date(start).getTime())).toBe("open");
  });
});

describe("date formatting", () => {
  /* Month names come from a literal table rather than toLocaleDateString,
     so Node's and the browser's locale data cannot disagree and break
     hydration. Asserting the exact strings is what keeps that true. */
  it("formats a day as a fixed three-letter month and padded date", () => {
    expect(eventDay(new Date("2026-09-05T09:00:00.000Z").getTime())).toEqual({
      month: "SEP",
      day: "05",
    });
    expect(eventDay(new Date("2026-12-31T23:00:00.000Z").getTime())).toEqual({
      month: "DEC",
      day: "31",
    });
  });

  it("formats the clock in UTC with padding", () => {
    expect(eventClock(new Date("2026-09-05T09:05:00.000Z").getTime())).toBe("09:05 UTC");
    expect(eventClock(new Date("2026-09-05T00:00:00.000Z").getTime())).toBe("00:00 UTC");
  });
});

describe("sample events", () => {
  it("keeps the three original examples", () => {
    expect(SAMPLE_EVENTS).toHaveLength(3);
    expect(SAMPLE_EVENTS.map((e) => e.place)).toEqual(["Almaty", "Astana", "Balkhash"]);
  });

  /* Derived from the build moment rather than hardcoded: the original
     fixed dates had drifted into the past, which reads as a dead page. */
  it("dates them relative to the build, not to a hardcoded day", () => {
    const build = new Date(
      process.env.NEXT_PUBLIC_BUILD_TIME ?? "2026-07-25T00:00:00.000Z",
    ).getTime();
    for (const e of SAMPLE_EVENTS) expect(e.startsAt).toBeGreaterThan(build);
  });

  it("keeps them in chronological order", () => {
    const times = SAMPLE_EVENTS.map((e) => e.startsAt);
    expect([...times].sort((a, b) => a - b)).toEqual(times);
  });
});

describe("check-in radius", () => {
  /* Mirrors the radius the Postgres trigger enforces. The browser copy is
     only for the tooltip — if the two ever disagree, the UI is lying about
     the rule. supabase/community-2.sql is the authority. */
  it("matches the 500 m the database enforces", () => {
    expect(CHECKIN_RADIUS_M).toBe(500);
  });
});
