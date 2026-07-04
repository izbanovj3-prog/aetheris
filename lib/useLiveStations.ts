"use client";

import { useEffect, useMemo, useState } from "react";
import { getStations, type Station } from "./data";
import { fetchLiveStations } from "./live";

/* Shared live-station subscription for the landing page: several sections
   (hero chips, ticker) need the same enriched network state, so the fetch is
   deduplicated at module level — one Open-Meteo round-trip per page load. */

interface LiveState {
  stations: Station[];
  /** true once at least one real reading has been merged in */
  live: boolean;
  /** epoch ms of the live fetch, null while on the modeled baseline */
  fetchedAt: number | null;
}

let cached: { stations: Station[]; fetchedAt: number } | null = null;
let inflight: ReturnType<typeof fetchLiveStations> | null = null;

export function useLiveStations(): LiveState {
  // Baseline first (SSR-safe, deterministic), enrich after mount — the same
  // no-hydration-mismatch pattern the dashboard and map already use.
  const baseline = useMemo(() => getStations(), []);
  const [state, setState] = useState<LiveState>(() =>
    cached
      ? { stations: cached.stations, live: true, fetchedAt: cached.fetchedAt }
      : { stations: baseline, live: false, fetchedAt: null },
  );

  useEffect(() => {
    if (cached) return;
    let alive = true;
    inflight ??= fetchLiveStations();
    inflight.then((r) => {
      if (!r.live) return;
      cached = { stations: r.stations, fetchedAt: r.fetchedAt };
      if (alive) {
        setState({ stations: r.stations, live: true, fetchedAt: r.fetchedAt });
      }
    });
    return () => {
      alive = false;
    };
  }, []);

  return state;
}
