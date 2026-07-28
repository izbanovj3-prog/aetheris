"use client";

import { useEffect, useState } from "react";
import { fetchCommunitySignals, emptySignal, type CitySignal } from "./community";

/* One request per page load, shared at module level like useLiveStations.
   Phases mirror useBiodiversity: "idle" until JS runs, so a page fetched
   without JS never claims to be loading something it isn't. */

let cached: Record<string, CitySignal> | null = null;
let inflight: ReturnType<typeof fetchCommunitySignals> | null = null;

export type SignalPhase = "idle" | "loading" | "ready" | "unavailable";

export interface CommunitySignalState {
  /** Null while unknown. A city with no reports yields a zeroed signal,
   *  which is a real answer and must not be confused with "unavailable". */
  signal: CitySignal | null;
  phase: SignalPhase;
}

export function useCommunitySignal(city: string | undefined): CommunitySignalState {
  const [state, setState] = useState<CommunitySignalState>(() =>
    cached && city
      ? { signal: cached[city] ?? emptySignal(city), phase: "ready" }
      : { signal: null, phase: "idle" },
  );

  useEffect(() => {
    if (!city) return;
    if (cached) {
      setState({ signal: cached[city] ?? emptySignal(city), phase: "ready" });
      return;
    }
    let alive = true;
    setState({ signal: null, phase: "loading" });

    inflight ??= fetchCommunitySignals();
    inflight.then((all) => {
      inflight = null;
      if (all) cached = all;
      if (!alive) return;
      setState(
        all
          ? { signal: all[city] ?? emptySignal(city), phase: "ready" }
          : { signal: null, phase: "unavailable" },
      );
    });

    return () => {
      alive = false;
    };
  }, [city]);

  return state;
}
