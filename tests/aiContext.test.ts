import { describe, expect, it } from "vitest";
import { MAX_STATION_KM, assistantPrompt, buildAiContext, nearestStation } from "@/lib/aiContext";
import { getStations } from "@/lib/data";
import type { Report } from "@/lib/reports";

const stations = getStations();
const almaty = stations.find((s) => s.name === "Almaty")!;

function report(over: Partial<Report> = {}): Report {
  return {
    id: "r-1",
    author: "You",
    initials: "YOU",
    city: "Almaty",
    category: "air",
    severity: "high",
    title: "Heavy smog",
    body: "b",
    status: "submitted",
    upvotes: 0,
    comments: 0,
    ...over,
  };
}

describe("nearestStation", () => {
  it("prefers the pin over the city label — that is what the pin is for", () => {
    const atCaspian = report({ city: "Almaty", lat: 43.651, lon: 51.157 });
    expect(nearestStation(atCaspian, stations)!.station.name).toBe("Aktau");
  });

  it("falls back to the city label when no pin was captured", () => {
    const near = nearestStation(report({ city: "Karaganda" }), stations)!;
    expect(near.station.name).toBe("Karaganda");
    expect(near.km).toBe(0);
  });

  it("returns the station itself at zero distance when the pin sits on it", () => {
    const near = nearestStation(report({ lat: almaty.lat, lon: almaty.lon }), stations)!;
    expect(near.station.name).toBe("Almaty");
    expect(near.km).toBeLessThan(1);
  });

  /* Quoting a station hundreds of kilometres away as "the nearest reading"
     would be context in name only. */
  it("gives up rather than quote a station beyond the distance limit", () => {
    const middleOfNowhere = report({ city: "", lat: 0, lon: 0 });
    expect(nearestStation(middleOfNowhere, stations)).toBeNull();
  });

  it("stays within the stated limit whenever it answers", () => {
    const near = nearestStation(report({ lat: 43.9, lon: 76.2 }), stations);
    expect(near!.km).toBeLessThanOrEqual(MAX_STATION_KM);
  });

  it("returns null for a city label that is not in the network", () => {
    expect(nearestStation(report({ city: "Nowhereville" }), stations)).toBeNull();
  });
});

describe("buildAiContext", () => {
  /* The modeled baseline must never be quoted as though an instrument had
     produced it — saying nothing beats saying something unsourced. */
  it("says nothing for air when no live reading was fetched", async () => {
    const ctx = await buildAiContext(report(), stations, false, null);
    expect(ctx).toBeNull();
  });

  it("quotes the live station for an air report", async () => {
    const ctx = await buildAiContext(report(), stations, true, Date.now());
    expect(ctx!.kind).toBe("air");
    expect(ctx!.text).toContain("US AQI");
    expect(ctx!.source).toContain("Open-Meteo");
  });

  /* No free real-time feed covers water or waste, and the bubble says so
     rather than reaching for the modeled index as a stand-in. */
  it.each(["water", "waste"] as const)(
    "states plainly that %s has no live source",
    async (category) => {
      const ctx = await buildAiContext(report({ category }), stations, true, Date.now());
      expect(ctx!.kind).toBe("none");
      expect(ctx!.text.toLowerCase()).toContain("no live");
    },
  );

  /* The whole point of the bubble is that it is context, not a verdict. A
     word like "confirms" or "consistent with" turns a reading into a
     ruling on someone's report. */
  it("never phrases the context as a verdict", async () => {
    const forbidden = /confirms?\b|verif|proves?\b|consistent with|подтвержда/i;
    for (const category of ["air", "water", "waste", "industrial"] as const) {
      const ctx = await buildAiContext(report({ category }), stations, true, Date.now());
      if (ctx) expect(ctx.text, category).not.toMatch(forbidden);
    }
  });

  it("never implies a satellite cross-check, which does not exist", async () => {
    for (const category of ["air", "water", "waste", "industrial"] as const) {
      const ctx = await buildAiContext(report({ category }), stations, true, Date.now());
      if (ctx) expect(ctx.text.toLowerCase(), category).not.toContain("satellite");
    }
  });
});

describe("failure is distinguishable from silence", () => {
  /* The card renders nothing when buildAiContext resolves null, so a
     failed lookup that resolved null looked exactly like a category with
     no live source. It has to reject instead, or the UI cannot tell the
     two apart — which is how the GBIF block failed silently before. */
  it("rejects when the GBIF lookup fails, rather than resolving null", async () => {
    const original = globalThis.fetch;
    globalThis.fetch = (() => Promise.reject(new Error("network down"))) as typeof fetch;
    try {
      await expect(
        buildAiContext(report({ category: "biodiversity" }), stations, true, Date.now()),
      ).rejects.toThrow(/GBIF/i);
    } finally {
      globalThis.fetch = original;
    }
  });

  it("still resolves null for a location with no station in range", async () => {
    const ctx = await buildAiContext(
      report({ city: "", lat: 0, lon: 0 }),
      stations,
      true,
      Date.now(),
    );
    expect(ctx).toBeNull();
  });
});

describe("assistantPrompt", () => {
  it("carries the place and the report's own words", () => {
    const q = assistantPrompt(report({ title: "Heavy smog layer" }), null);
    expect(q).toContain("Almaty");
    expect(q).toContain("Heavy smog layer");
  });

  it("names the right subject per category", () => {
    expect(assistantPrompt(report({ category: "water" }), null)).toContain("воды");
    expect(assistantPrompt(report({ category: "biodiversity" }), null)).toContain(
      "биоразнообразием",
    );
  });

  it("survives a report with no AI context attached", () => {
    expect(() => assistantPrompt(report(), null)).not.toThrow();
  });

  it("stays short enough to sit in a query string", () => {
    expect(encodeURIComponent(assistantPrompt(report(), null)).length).toBeLessThan(1500);
  });
});
