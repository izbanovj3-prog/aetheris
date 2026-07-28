"use client";

import { useEffect, useState } from "react";
import type { Station } from "./data";
import { fetchCityBiodiversity, type CityBiodiversity } from "./gbif";

/* Single-city GBIF subscription for /city/[id] and the Atlas panel.
   Mirrors useLiveStations: render the modeled baseline first (SSR-safe),
   then fold in the live species signal after mount. Results are memoised
   at module level so re-selecting a city does not re-query GBIF.

   The phases matter for honesty. Before hydration nothing has been
   requested — saying "querying…" there would describe work that is not
   happening, and on a page fetched without JS it would sit that way
   forever, reading as broken. "idle" is therefore its own state, and a
   request that stalls resolves to "unavailable" rather than spinning. */

const cache = new Map<string, CityBiodiversity>();
const inflight = new Map<string, Promise<CityBiodiversity | null>>();

/** Longest we let a request run before calling it unavailable. Measured
 *  round-trips are 0.4–0.8 s, so this only trips on a genuine stall. */
const TIMEOUT_MS = 10_000;

export type BioPhase =
  /** Not started — server render, or JS has not run. */
  | "idle"
  /** Request in flight. */
  | "loading"
  /** Data returned. */
  | "ready"
  /** Failed, or took longer than TIMEOUT_MS. */
  | "unavailable";

export interface BiodiversityState {
  data: CityBiodiversity | null;
  live: boolean;
  phase: BioPhase;
}

export function useBiodiversity(station: Station | undefined): BiodiversityState {
  const id = station?.id;
  const [state, setState] = useState<BiodiversityState>(() => {
    const hit = id ? cache.get(id) : undefined;
    // Deliberately "idle", never "loading": on the server, and on the very
    // first client render, no request exists yet.
    return hit
      ? { data: hit, live: true, phase: "ready" }
      : { data: null, live: false, phase: "idle" };
  });

  useEffect(() => {
    if (!station) {
      setState({ data: null, live: false, phase: "idle" });
      return;
    }
    const hit = cache.get(station.id);
    if (hit) {
      setState({ data: hit, live: true, phase: "ready" });
      return;
    }

    let alive = true;
    setState({ data: null, live: false, phase: "loading" });

    let p = inflight.get(station.id);
    if (!p) {
      p = fetchCityBiodiversity(station);
      inflight.set(station.id, p);
    }

    // A stalled request must land somewhere other than the loading state.
    const timer = setTimeout(() => {
      if (alive) setState({ data: null, live: false, phase: "unavailable" });
    }, TIMEOUT_MS);

    p.then((r) => {
      inflight.delete(station.id);
      if (r) cache.set(station.id, r);
      if (!alive) return;
      clearTimeout(timer);
      setState(
        r
          ? { data: r, live: true, phase: "ready" }
          : { data: null, live: false, phase: "unavailable" },
      );
    });

    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [station]);

  return state;
}
