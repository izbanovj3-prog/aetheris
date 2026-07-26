"use client";

import { useEffect, useState } from "react";
import type { Station } from "./data";
import { fetchCityBiodiversity, type CityBiodiversity } from "./gbif";

/* Single-city GBIF subscription for /city/[id]. Mirrors useLiveStations:
   render the modeled baseline first (SSR-safe), then fold in the live
   species signal after mount. Results are memoised at module level so
   navigating back to a city does not re-query GBIF. */

const cache = new Map<string, CityBiodiversity>();
const inflight = new Map<string, Promise<CityBiodiversity | null>>();

export interface BiodiversityState {
  data: CityBiodiversity | null;
  live: boolean;
  /** True while the first request for this city is outstanding. */
  loading: boolean;
}

export function useBiodiversity(station: Station | undefined): BiodiversityState {
  const id = station?.id;
  const [state, setState] = useState<BiodiversityState>(() => {
    const hit = id ? cache.get(id) : undefined;
    return hit
      ? { data: hit, live: true, loading: false }
      : { data: null, live: false, loading: !!id };
  });

  useEffect(() => {
    if (!station) return;
    const hit = cache.get(station.id);
    if (hit) {
      setState({ data: hit, live: true, loading: false });
      return;
    }
    let alive = true;
    setState((s) => ({ ...s, loading: true }));

    let p = inflight.get(station.id);
    if (!p) {
      p = fetchCityBiodiversity(station);
      inflight.set(station.id, p);
    }
    p.then((r) => {
      inflight.delete(station.id);
      if (r) cache.set(station.id, r);
      if (alive) setState({ data: r, live: !!r, loading: false });
    });

    return () => {
      alive = false;
    };
  }, [station]);

  return state;
}
