"use client";

import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import {
  HOTSPOTS,
  LAYERS,
  aqiBand,
  genSeries,
  getStations,
  scoreBand,
  type LayerKey,
  type Station,
} from "@/lib/data";
import { fetchLiveStations } from "@/lib/live";
import { EASE } from "@/components/ui/primitives";
import { AtlasBoot } from "./AtlasBoot";
import { GlobalPulse } from "./GlobalPulse";
import { LayerLegend } from "./LayerLegend";

/* ─────────────────────────────────────────────────────────────
   AETHERIS · Global Atlas

   Engine (idle-safe): the map only repaints when something genuinely
   animates. Every ambient effect (boot, atmosphere, HUD, hover ring,
   click ping) is DOM/CSS/SVG composited over the canvas — never a
   per-frame MapLibre repaint.
   ───────────────────────────────────────────────────────────── */

type Tone = "emerald" | "cyan" | "amber" | "coral";
const TONE_TEXT: Record<Tone, string> = {
  emerald: "text-emerald",
  cyan: "text-cyan",
  amber: "text-amber",
  coral: "text-coral",
};
const TONE_HEX: Record<Tone, string> = {
  emerald: "#2de2a6",
  cyan: "#4fd8f7",
  amber: "#f5b352",
  coral: "#f57362",
};

const KIND_LABEL: Record<string, string> = {
  capital: "National capital",
  metropolis: "Metropolis",
  industrial: "Industrial hub",
  resource: "Resource hub",
  regional: "Regional centre",
};

interface LayerVis {
  prop: keyof Station;
  domain: [number, number];
  ramp: [string, string, string];
  value: (s: Station) => number;
  band: (s: Station) => { label: string; tone: Tone };
}

const LAYER_VIS: Record<LayerKey, LayerVis> = {
  air: {
    prop: "aqi",
    domain: [10, 260],
    ramp: ["#2de2a6", "#f5b352", "#f57362"],
    value: (s) => s.aqi,
    band: (s) => aqiBand(s.aqi),
  },
  industrial: {
    prop: "industrialEmissions",
    domain: [10, 95],
    ramp: ["#3a4a55", "#f5b352", "#f57362"],
    value: (s) => s.industrialEmissions,
    band: (s) => scoreBand(100 - s.industrialEmissions),
  },
  water: {
    prop: "waterQuality",
    domain: [20, 95],
    ramp: ["#f57362", "#f5b352", "#4f9dde"],
    value: (s) => s.waterQuality,
    band: (s) => scoreBand(s.waterQuality),
  },
  biodiversity: {
    prop: "biodiversity",
    domain: [15, 95],
    ramp: ["#f57362", "#f5b352", "#2de2a6"],
    value: (s) => s.biodiversity,
    band: (s) => scoreBand(s.biodiversity),
  },
  risk: {
    prop: "climateRisk",
    domain: [10, 90],
    ramp: ["#2de2a6", "#f5b352", "#f57362"],
    value: (s) => s.climateRisk,
    band: (s) => scoreBand(100 - s.climateRisk),
  },
};

const colorExpr = (layer: LayerKey) => {
  const { prop, domain, ramp } = LAYER_VIS[layer];
  const [lo, hi] = domain;
  return [
    "interpolate", ["linear"], ["get", prop],
    lo, ramp[0], (lo + hi) / 2, ramp[1], hi, ramp[2],
  ] as unknown as maplibregl.ExpressionSpecification;
};

const STYLE: maplibregl.StyleSpecification = {
  version: 8,
  // Self-hosted glyphs (Noto Sans, vendored in public/fonts) — no external
  // font CDN, so labels render cleanly with no runtime dependency.
  glyphs: "/fonts/{fontstack}/{range}.pbf",
  sources: {
    carto: {
      type: "raster",
      tiles: [
        "https://a.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}@2x.png",
        "https://b.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}@2x.png",
        "https://c.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}@2x.png",
      ],
      tileSize: 256,
      attribution: "© OpenStreetMap · © CARTO",
    },
  },
  layers: [
    { id: "bg", type: "background", paint: { "background-color": "#04080b" } },
    {
      id: "carto",
      type: "raster",
      source: "carto",
      paint: { "raster-opacity": 0.62, "raster-contrast": 0.05 },
    },
  ],
};

/** National framing — centred on Kazakhstan. */
const KZ_CENTER: [number, number] = [67.5, 48.2];
const KZ_ZOOM = 4.1;

/* ── root ─────────────────────────────────────────────────── */

export default function EnvironmentalMap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  const [ready, setReady] = useState(false);
  const [booting, setBooting] = useState(true);
  const [activeLayer, setActiveLayer] = useState<LayerKey>("air");
  const [selected, setSelected] = useState<Station | null>(null);
  const [hoverStation, setHoverStation] = useState<Station | null>(null);
  const [isDesktop, setIsDesktop] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [railOpen, setRailOpen] = useState(false);
  const [liveOn, setLiveOn] = useState(false);

  const stations = useMemo(() => getStationsFC(), []);

  const hoverCardRef = useRef<HTMLDivElement>(null);
  const hoverRingRef = useRef<HTMLDivElement>(null);
  const pingRef = useRef<HTMLDivElement>(null);
  const hoverIdRef = useRef<string | null>(null);
  const selectedRef = useRef<Station | null>(null);
  const reducedRef = useRef(false);
  useEffect(() => {
    selectedRef.current = selected;
  }, [selected]);
  useEffect(() => {
    reducedRef.current = reducedMotion;
  }, [reducedMotion]);

  /* imperative overlays — no React renders on cursor move */
  const positionHover = useCallback((x: number, y: number) => {
    const card = hoverCardRef.current;
    if (card) {
      const cx = Math.min(x + 16, window.innerWidth - 236);
      card.style.transform = `translate3d(${cx}px, ${y - 10}px, 0)`;
    }
    const ring = hoverRingRef.current;
    if (ring) ring.style.transform = `translate3d(${x - 23}px, ${y - 23}px, 0)`;
  }, []);
  const showHover = useCallback((on: boolean) => {
    if (hoverCardRef.current) hoverCardRef.current.style.opacity = on ? "1" : "0";
    if (hoverRingRef.current) hoverRingRef.current.style.opacity = on ? "1" : "0";
  }, []);
  const triggerPing = useCallback((x: number, y: number) => {
    const el = pingRef.current;
    if (!el || reducedRef.current) return;
    el.animate(
      [
        { transform: `translate3d(${x - 32}px, ${y - 32}px, 0) scale(0.3)`, opacity: 0.85 },
        { transform: `translate3d(${x - 32}px, ${y - 32}px, 0) scale(2.3)`, opacity: 0 },
      ],
      { duration: 650, easing: "cubic-bezier(0.22,1,0.36,1)" },
    );
  }, []);

  /* media queries */
  useEffect(() => {
    const mqD = window.matchMedia("(min-width: 640px)");
    const mqR = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => {
      setIsDesktop(mqD.matches);
      setReducedMotion(mqR.matches);
    };
    sync();
    mqD.addEventListener("change", sync);
    mqR.addEventListener("change", sync);
    return () => {
      mqD.removeEventListener("change", sync);
      mqR.removeEventListener("change", sync);
    };
  }, []);

  /* ── map lifecycle (once) ── */
  useEffect(() => {
    const container = containerRef.current;
    if (!container || mapRef.current) return;

    const map = new maplibregl.Map({
      container,
      style: STYLE,
      center: KZ_CENTER,
      zoom: 4.1,
      minZoom: 3.3,
      maxZoom: 11,
      maxBounds: [
        [40, 38],
        [92, 58],
      ],
      dragRotate: false,
      trackResize: false,
      attributionControl: { compact: true },
    });
    mapRef.current = map;
    map.touchZoomRotate.disableRotation();
    map.getCanvas().setAttribute("tabindex", "0");
    map.getCanvas().setAttribute("aria-label", "Environmental map canvas");

    const ro = new ResizeObserver(() => map.resize());
    ro.observe(container);

    map.on("load", () => {
      map.addSource("stations", { type: "geojson", data: stations });
      map.addSource("hotspots", { type: "geojson", data: hotspotsFC() });

      map.addLayer({
        id: "heat",
        type: "heatmap",
        source: "stations",
        paint: {
          "heatmap-weight": ["interpolate", ["linear"], ["get", "aqi"], 0, 0, 280, 1],
          "heatmap-intensity": ["interpolate", ["linear"], ["zoom"], 1, 0.6, 8, 1.6],
          "heatmap-radius": ["interpolate", ["linear"], ["zoom"], 1, 34, 8, 90],
          "heatmap-opacity": 0.5,
          "heatmap-color": [
            "interpolate", ["linear"], ["heatmap-density"],
            0, "rgba(0,0,0,0)",
            0.25, "rgba(45,226,166,0.10)",
            0.5, "rgba(79,216,247,0.16)",
            0.75, "rgba(245,179,82,0.22)",
            1, "rgba(245,115,98,0.30)",
          ],
        },
      });
      map.addLayer({
        id: "stations-halo",
        type: "circle",
        source: "stations",
        paint: {
          "circle-radius": ["interpolate", ["linear"], ["zoom"], 1, 9, 8, 22],
          "circle-color": colorExpr("air"),
          "circle-opacity": 0.12,
          "circle-blur": 1,
        },
      });
      map.addLayer({
        id: "stations-circles",
        type: "circle",
        source: "stations",
        paint: {
          "circle-radius": ["interpolate", ["linear"], ["zoom"], 3.5, 4.5, 8, 11],
          "circle-color": colorExpr("air"),
          "circle-stroke-width": 1.2,
          "circle-stroke-color": "rgba(233,243,244,0.35)",
          "circle-opacity": 0.92,
        },
      });
      map.addLayer({
        id: "hotspots-glow",
        type: "circle",
        source: "hotspots",
        layout: { visibility: "none" },
        paint: {
          "circle-radius": ["interpolate", ["linear"], ["get", "severity"], 50, 16, 95, 34],
          "circle-color": "#f57362",
          "circle-opacity": 0.2,
          "circle-blur": 1,
        },
      });
      map.addLayer({
        id: "hotspots-core",
        type: "circle",
        source: "hotspots",
        layout: { visibility: "none" },
        paint: {
          "circle-radius": ["interpolate", ["linear"], ["get", "severity"], 50, 4, 95, 8],
          "circle-color": "#ffb09f",
          "circle-stroke-width": 1,
          "circle-stroke-color": "rgba(245,115,98,0.8)",
        },
      });
      map.addLayer({
        id: "city-labels",
        type: "symbol",
        source: "stations",
        layout: {
          "text-field": ["get", "name"],
          "text-font": ["noto"],
          "text-size": ["interpolate", ["linear"], ["zoom"], 4, 10, 8, 14],
          "text-offset": [0, 1.25],
          "text-anchor": "top",
          "text-allow-overlap": false,
          "text-optional": true,
        },
        paint: {
          "text-color": "#d3e8ec",
          "text-halo-color": "rgba(3,6,8,0.92)",
          "text-halo-width": 1.4,
          "text-opacity": ["interpolate", ["linear"], ["zoom"], 3.4, 0, 4.2, 0.92],
        },
      });

      const canvas = map.getCanvas();

      map.on("mousemove", "stations-circles", (e) => {
        const f = e.features?.[0];
        if (!f) return;
        canvas.style.cursor = "pointer";
        if (selectedRef.current) return;
        const s = f.properties as unknown as Station;
        positionHover(e.point.x, e.point.y);
        showHover(true);
        if (hoverIdRef.current !== s.id) {
          hoverIdRef.current = s.id;
          setHoverStation(s);
        }
      });
      map.on("mouseleave", "stations-circles", () => {
        canvas.style.cursor = "";
        hoverIdRef.current = null;
        showHover(false);
      });

      map.on("click", (e) => {
        triggerPing(e.point.x, e.point.y);
        const hits = map.queryRenderedFeatures(e.point, { layers: ["stations-circles"] });
        if (!hits.length) {
          setSelected(null);
          return;
        }
        showHover(false);
        hoverIdRef.current = null;
        setSelected(hits[0].properties as unknown as Station);
      });

      if (process.env.NODE_ENV !== "production") {
        (window as unknown as { __atlas?: maplibregl.Map }).__atlas = map;
      }

      setReady(true);
    });

    return () => {
      ro.disconnect();
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── recolor + overlay visibility ── */
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    map.setPaintProperty("stations-circles", "circle-color", colorExpr(activeLayer));
    map.setPaintProperty("stations-halo", "circle-color", colorExpr(activeLayer));
    map.setLayoutProperty("heat", "visibility", activeLayer === "air" ? "visible" : "none");
    const hotVis = activeLayer === "industrial" ? "visible" : "none";
    map.setLayoutProperty("hotspots-glow", "visibility", hotVis);
    map.setLayoutProperty("hotspots-core", "visibility", hotVis);
  }, [activeLayer, ready]);

  /* ── live data: enrich markers with real Open-Meteo air quality + weather.
     The color/heat expressions read ["get", prop], so updating the source
     data repaints the field automatically — and hovers/clicks then surface
     real readings. Falls back silently to the simulated baseline. ── */
  useEffect(() => {
    if (!ready) return;
    const ac = new AbortController();
    fetchLiveStations(ac.signal)
      .then((res) => {
        const map = mapRef.current;
        if (!res.live || !map) return;
        const src = map.getSource("stations");
        if (src && "setData" in src) {
          (src as maplibregl.GeoJSONSource).setData(fcFromStations(res.stations));
          setLiveOn(true);
        }
      })
      .catch(() => {});
    return () => ac.abort();
  }, [ready]);

  /* ── hotspot pulse: ONLY on the industrial layer, never under reduced motion ── */
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready || activeLayer !== "industrial" || reducedMotion) return;
    let raf = 0;
    const pulse = (t: number) => {
      if (map.getLayer("hotspots-glow")) {
        const k = 0.5 + 0.5 * Math.sin(t / 480);
        map.setPaintProperty("hotspots-glow", "circle-opacity", 0.14 + 0.16 * k);
      }
      raf = requestAnimationFrame(pulse);
    };
    raf = requestAnimationFrame(pulse);
    return () => {
      cancelAnimationFrame(raf);
      if (map.getLayer("hotspots-glow")) {
        map.setPaintProperty("hotspots-glow", "circle-opacity", 0.2);
      }
    };
  }, [activeLayer, ready, reducedMotion]);

  /* ── selection-driven camera (single owner of center + padding) ── */
  const prevSelId = useRef<string | null>(null);
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    if (selected) {
      const padding = isDesktop
        ? { top: 0, left: 0, bottom: 0, right: 392 }
        : { top: 0, left: 0, right: 0, bottom: Math.round(window.innerHeight * 0.58) };
      if (prevSelId.current !== selected.id) {
        map.flyTo({
          center: [selected.lon, selected.lat],
          zoom: Math.max(map.getZoom(), 6.4),
          duration: reducedMotion ? 0 : 2000,
          curve: 1.5,
          essential: true,
          padding,
        });
      } else {
        map.easeTo({ padding, duration: reducedMotion ? 0 : 300, essential: true });
      }
      prevSelId.current = selected.id;
    } else {
      prevSelId.current = null;
      map.easeTo({
        padding: { top: 0, left: 0, right: 0, bottom: 0 },
        duration: reducedMotion ? 0 : 450,
        essential: true,
      });
    }
  }, [selected, isDesktop, ready, reducedMotion]);

  const closePanel = useCallback(() => setSelected(null), []);
  const zoomIn = useCallback(() => mapRef.current?.zoomIn({ duration: 400 }), []);
  const zoomOut = useCallback(() => mapRef.current?.zoomOut({ duration: 400 }), []);
  const resetView = useCallback(() => {
    setSelected(null);
    mapRef.current?.flyTo({
      center: KZ_CENTER,
      zoom: KZ_ZOOM,
      duration: reducedRef.current ? 0 : 1600,
      essential: true,
    });
  }, []);

  const vis = LAYER_VIS[activeLayer];

  return (
    <div className="relative w-full h-[100svh] overflow-hidden bg-abyss">
      <div
        ref={containerRef}
        // Inline position/inset: MapLibre's unlayered `.maplibregl-map { position: relative }`
        // overrides Tailwind's layered `.absolute`, collapsing the container to 0 height.
        // Inline styles beat any stylesheet, so the canvas always fills the viewport.
        style={{ position: "absolute", inset: 0 }}
        role="region"
        aria-label="Interactive environmental map of Kazakhstan"
      />

      {/* ── atmospheric depth (compositor-only; never repaints the map) ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden>
        <div
          data-atlas-fx
          className="absolute -inset-[20%]"
          style={{
            background: "radial-gradient(circle at 50% 50%, rgba(45,226,166,0.07), transparent 60%)",
            filter: "blur(60px)",
            animation: reducedMotion ? "none" : "atlas-drift-a 30s ease-in-out infinite",
            willChange: "transform",
          }}
        />
        <div
          data-atlas-fx
          className="absolute -inset-[20%]"
          style={{
            background: "radial-gradient(circle at 50% 50%, rgba(79,157,222,0.07), transparent 60%)",
            filter: "blur(70px)",
            animation: reducedMotion ? "none" : "atlas-drift-b 38s ease-in-out infinite",
            willChange: "transform",
          }}
        />
        {/* aurora rim at the top */}
        <div
          data-atlas-fx
          className="absolute inset-x-0 top-0 h-40 origin-top"
          style={{
            background: "linear-gradient(180deg, rgba(79,216,247,0.10), transparent)",
            animation: reducedMotion ? "none" : "aurora-pulse 9s ease-in-out infinite",
          }}
        />
        {/* faux Earth-curvature horizon glow at the bottom */}
        <div
          className="absolute inset-x-0 bottom-0 h-[42%]"
          style={{
            background:
              "radial-gradient(120% 90% at 50% 140%, rgba(79,157,222,0.16), rgba(45,226,166,0.05) 40%, transparent 60%)",
          }}
        />
        {/* slow vertical scanline */}
        <div
          data-atlas-fx
          className="absolute inset-x-0 top-0 h-px"
          style={{
            background: "linear-gradient(90deg, transparent, rgba(79,216,247,0.5), transparent)",
            animation: reducedMotion ? "none" : "atlas-scanline 11s linear infinite",
          }}
        />
        {/* vignette + top scrim */}
        <div className="absolute inset-0 shadow-[inset_0_0_150px_70px_rgba(3,6,8,0.92)]" />
        <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-abyss/90 to-transparent" />
      </div>

      {/* hover glow ring (imperative) */}
      <div
        ref={hoverRingRef}
        aria-hidden
        className="absolute top-0 left-0 z-20 w-[46px] h-[46px] rounded-full pointer-events-none opacity-0 transition-opacity duration-150"
        style={{
          transform: "translate3d(-9999px,0,0)",
          border: "1px solid rgba(45,226,166,0.7)",
          boxShadow: "0 0 18px rgba(45,226,166,0.45), inset 0 0 12px rgba(45,226,166,0.25)",
          willChange: "transform, opacity",
        }}
      />
      {/* click ping (imperative, WAAPI) */}
      <div
        ref={pingRef}
        aria-hidden
        className="absolute top-0 left-0 z-20 w-16 h-16 rounded-full pointer-events-none opacity-0"
        style={{
          border: "1px solid rgba(79,216,247,0.6)",
          willChange: "transform, opacity",
        }}
      />

      {/* hover card (imperative position, content via state) */}
      <div
        ref={hoverCardRef}
        aria-hidden
        className="absolute top-0 left-0 z-20 pointer-events-none glass-bright panel-glow rounded-xl px-4 py-3 w-[220px] opacity-0 transition-opacity duration-150"
        style={{ transform: "translate3d(-9999px,0,0)", willChange: "transform, opacity" }}
      >
        {hoverStation && <HoverContent station={hoverStation} layer={activeLayer} />}
      </div>

      <LayerRail
        activeLayer={activeLayer}
        onSelect={setActiveLayer}
        isDesktop={isDesktop}
        open={railOpen}
        onToggle={() => setRailOpen((v) => !v)}
      />

      <GlobalPulse isDesktop={isDesktop} />

      <LayerLegend
        layer={activeLayer}
        label={LAYERS[activeLayer].label}
        unit={LAYERS[activeLayer].unit}
        ramp={vis.ramp}
        domain={vis.domain}
      />

      {/* zoom / home controls */}
      <div className="absolute right-3 sm:right-4 bottom-4 z-20 flex flex-col gap-1.5">
        <MapButton label="Zoom in" onClick={zoomIn}>
          <svg viewBox="0 0 16 16" className="w-4 h-4" fill="none" aria-hidden>
            <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </MapButton>
        <MapButton label="Zoom out" onClick={zoomOut}>
          <svg viewBox="0 0 16 16" className="w-4 h-4" fill="none" aria-hidden>
            <path d="M3 8h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </MapButton>
        <MapButton label="Reset view" onClick={resetView}>
          <svg viewBox="0 0 16 16" className="w-3.5 h-3.5" fill="none" aria-hidden>
            <circle cx="8" cy="8" r="5.2" stroke="currentColor" strokeWidth="1.4" />
            <path d="M8 1.5v2M8 12.5v2M1.5 8h2M12.5 8h2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
        </MapButton>
      </div>

      {/* analytics panel */}
      <AnimatePresence>
        {selected && (
          <StationPanel
            key={selected.id}
            station={selected}
            isDesktop={isDesktop}
            onClose={closePanel}
          />
        )}
      </AnimatePresence>

      {/* status bar */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 glass rounded-full px-5 py-2 hidden sm:flex items-center gap-4">
        <span className="flex items-center gap-2">
          <span className="dot-live" />
          <span className="telemetry telemetry-bright">{stations.features.length} cities · Kazakhstan</span>
        </span>
        <span className="w-px h-3 bg-line-bright" />
        <span className="telemetry">{HOTSPOTS.length} environmental hotspots tracked</span>
        {liveOn && (
          <>
            <span className="w-px h-3 bg-line-bright" />
            <span className="telemetry text-emerald">● live air · Open-Meteo</span>
          </>
        )}
      </div>

      {/* cinematic boot */}
      <AnimatePresence>
        {booting && (
          <AtlasBoot
            ready={ready}
            reducedMotion={reducedMotion}
            onDone={() => setBooting(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── small map control button ─────────────────────────────── */

function MapButton({
  children,
  label,
  onClick,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="grid place-items-center w-9 h-9 glass-bright panel-glow rounded-xl text-ink-dim hover:text-emerald hover:border-emerald/30 active:scale-95 transition-all duration-200"
    >
      {children}
    </button>
  );
}

/* ── GeoJSON builders ─────────────────────────────────────── */

function fcFromStations(list: Station[]): GeoJSON.FeatureCollection {
  return {
    type: "FeatureCollection",
    features: list.map((s) => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: [s.lon, s.lat] },
      properties: { ...s },
    })),
  };
}

function getStationsFC(): GeoJSON.FeatureCollection {
  return fcFromStations(getStations());
}

function hotspotsFC(): GeoJSON.FeatureCollection {
  return {
    type: "FeatureCollection",
    features: HOTSPOTS.map((h) => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: [h.lon, h.lat] },
      properties: { ...h },
    })),
  };
}

/* ── layer rail (responsive + collapsible) ────────────────── */

const LayerRail = memo(function LayerRail({
  activeLayer,
  onSelect,
  isDesktop,
  open,
  onToggle,
}: {
  activeLayer: LayerKey;
  onSelect: (k: LayerKey) => void;
  isDesktop: boolean;
  open: boolean;
  onToggle: () => void;
}) {
  const keys = Object.keys(LAYERS) as LayerKey[];
  const active = LAYERS[activeLayer];

  const list = (
    <div className="flex flex-col gap-1">
      {keys.map((k) => {
        const l = LAYERS[k];
        const on = activeLayer === k;
        return (
          <button
            key={k}
            type="button"
            aria-pressed={on}
            onClick={() => {
              onSelect(k);
              if (!isDesktop) onToggle();
            }}
            className={`relative flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left text-[13px] font-medium transition-colors duration-300 ${
              on ? "text-ink" : "text-ink-dim hover:text-ink"
            }`}
          >
            {on && (
              <motion.span
                layoutId="layer-pill"
                className="absolute inset-0 rounded-xl bg-carbon-3 border border-line-bright"
                transition={{ type: "spring", stiffness: 400, damping: 32 }}
              />
            )}
            <span
              className="relative w-2 h-2 rounded-full shrink-0"
              style={{ background: l.color, boxShadow: on ? `0 0 8px ${l.color}` : "none" }}
            />
            <span className="relative flex-1">{l.label}</span>
            <span className="relative telemetry !text-[9px]">{l.unit}</span>
          </button>
        );
      })}
    </div>
  );

  /* mobile: collapsed chip that expands into the list */
  if (!isDesktop) {
    return (
      <div className="absolute left-3 top-24 z-30 w-[200px]">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          className="w-full glass-bright panel-glow rounded-2xl px-3 py-2.5 flex items-center gap-2.5"
        >
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{ background: active.color, boxShadow: `0 0 8px ${active.color}` }}
          />
          <span className="flex-1 text-left text-[13px] font-medium text-ink">{active.label}</span>
          <svg
            viewBox="0 0 16 16"
            className={`w-3.5 h-3.5 text-ink-dim transition-transform duration-300 ${open ? "rotate-180" : ""}`}
            fill="none"
            aria-hidden
          >
            <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25, ease: EASE }}
              className="mt-2 glass-bright panel-glow rounded-2xl p-2"
            >
              <span className="telemetry px-3 pt-1 pb-1.5 block">Layers</span>
              {list}
              <p className="text-[11px] leading-relaxed text-ink-faint font-light px-3 pt-2 border-t border-line mt-1">
                {active.describe}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  /* desktop: persistent rail */
  return (
    <motion.div
      initial={{ opacity: 0, x: -24 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.9, delay: 0.3, ease: EASE }}
      className="absolute left-4 top-24 z-20 glass-bright panel-glow rounded-2xl p-2 flex flex-col gap-1 w-[200px]"
      role="group"
      aria-label="Environmental layers"
    >
      <span className="telemetry px-3 pt-2 pb-1.5">Layers</span>
      {list}
      <div className="border-t border-line mt-1 px-3 py-2.5">
        <p className="text-[11px] leading-relaxed text-ink-faint font-light">{active.describe}</p>
      </div>
    </motion.div>
  );
});

/* ── hover content ────────────────────────────────────────── */

function HoverContent({ station, layer }: { station: Station; layer: LayerKey }) {
  const v = LAYER_VIS[layer];
  const band = v.band(station);
  return (
    <>
      <div className="flex items-center justify-between gap-3 mb-1.5">
        <span className="font-[family-name:var(--font-syne)] font-bold text-sm">{station.name}</span>
        <span className="telemetry !text-[9px]">{station.region}</span>
      </div>
      <div className="flex items-baseline justify-between">
        <span className="text-[11px] text-ink-faint">{LAYERS[layer].label}</span>
        <span className={`readout text-base font-medium ${TONE_TEXT[band.tone]}`}>
          {Math.round(v.value(station))}
          <span className="text-[10px] ml-1 opacity-70">{band.label}</span>
        </span>
      </div>
      <span className="telemetry !text-[9px] mt-2 block text-emerald/70">Click to open analytics →</span>
    </>
  );
}

/* ── station analytics panel ──────────────────────────────── */

const MetricRow = memo(function MetricRow({
  label,
  value,
  max,
  color,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between">
        <span className="text-[12px] text-ink-dim">{label}</span>
        <span className="readout text-sm" style={{ color }}>{value}</span>
      </div>
      <div className="h-1 rounded-full bg-carbon-3 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.min((value / max) * 100, 100)}%` }}
          transition={{ duration: 1.1, ease: EASE, delay: 0.25 }}
          className="h-full rounded-full"
          style={{ background: `linear-gradient(90deg, ${color}88, ${color})` }}
        />
      </div>
    </div>
  );
});

function TrendSpark({ id }: { id: string }) {
  const d = useMemo(() => {
    const pts = genSeries(`panel-${id}`, 48, 50, 20);
    const max = Math.max(...pts.map((p) => p.v));
    const min = Math.min(...pts.map((p) => p.v));
    return pts
      .map((p, i) => `${i === 0 ? "M" : "L"}${(i / (pts.length - 1)) * 100},${36 - ((p.v - min) / (max - min || 1)) * 30}`)
      .join(" ");
  }, [id]);
  return (
    <svg viewBox="0 0 100 40" className="w-full h-14" preserveAspectRatio="none" aria-hidden>
      <defs>
        <linearGradient id={`g-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2de2a6" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#2de2a6" stopOpacity="0" />
        </linearGradient>
      </defs>
      <motion.path
        d={d}
        fill="none"
        stroke="#2de2a6"
        strokeWidth="1.4"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.6, ease: "easeOut" }}
      />
      <path d={`${d} L100,40 L0,40 Z`} fill={`url(#g-${id})`} />
    </svg>
  );
}

const PANEL_VARIANTS = {
  desktop: { hidden: { opacity: 0, x: 60 }, show: { opacity: 1, x: 0 } },
  mobile: { hidden: { opacity: 0, y: 80 }, show: { opacity: 1, y: 0 } },
} satisfies Record<string, Variants>;

const StationPanel = memo(function StationPanel({
  station: s,
  isDesktop,
  onClose,
}: {
  station: Station;
  isDesktop: boolean;
  onClose: () => void;
}) {
  const air = aqiBand(s.aqi);
  const sus = scoreBand(s.sustainability);
  const variants = isDesktop ? PANEL_VARIANTS.desktop : PANEL_VARIANTS.mobile;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <motion.aside
      variants={variants}
      initial="hidden"
      animate="show"
      exit="hidden"
      transition={{ duration: 0.5, ease: EASE }}
      role="dialog"
      aria-label={`${s.name} environmental analytics`}
      className={
        isDesktop
          ? "absolute right-4 top-24 bottom-4 w-[360px] glass-bright panel-glow rounded-2xl ticks flex flex-col overflow-hidden z-30"
          : "absolute inset-x-2 bottom-2 top-auto max-h-[64svh] glass-bright panel-glow rounded-2xl ticks flex flex-col overflow-hidden z-30"
      }
    >
      <div className="p-5 border-b border-line flex items-start justify-between gap-3">
        <div>
          <div className="telemetry mb-1.5">
            {s.region} · {s.lat.toFixed(2)}°N, {s.lon.toFixed(2)}°E
          </div>
          <h2 className="font-[family-name:var(--font-syne)] font-bold text-2xl leading-none">{s.name}</h2>
          <div className="telemetry !text-[9px] mt-2 text-ink-faint">
            {KIND_LABEL[s.kind] ?? "City"} · {s.population.toLocaleString("en-US")} residents
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close panel"
          className="grid place-items-center w-8 h-8 rounded-lg border border-line text-ink-dim hover:text-ink hover:border-line-bright transition-colors shrink-0"
        >
          <svg viewBox="0 0 14 14" className="w-3 h-3" fill="none" aria-hidden>
            <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-6">
        <div className="flex items-end justify-between">
          <div>
            <div className="telemetry mb-1">Sustainability score</div>
            <div className={`readout text-5xl font-medium ${TONE_TEXT[sus.tone]}`}>{s.sustainability}</div>
          </div>
          <div className="text-right">
            <span className={`text-xs font-semibold ${TONE_TEXT[sus.tone]}`}>{sus.label}</span>
            <div className="telemetry mt-1">
              {s.trend === "improving" ? "▲ improving" : s.trend === "declining" ? "▼ declining" : "● stable"}
            </div>
          </div>
        </div>

        {/* live conditions */}
        <div className="grid grid-cols-3 divide-x divide-line rounded-xl bg-carbon-2/40 border border-line overflow-hidden">
          <div className="px-3 py-2.5 flex flex-col gap-0.5">
            <span className="telemetry !text-[8px]">Temperature</span>
            <span className="readout text-sm">{s.temperature}°C</span>
          </div>
          <div className="px-3 py-2.5 flex flex-col gap-0.5">
            <span className="telemetry !text-[8px]">Humidity</span>
            <span className="readout text-sm">{s.humidity}%</span>
          </div>
          <div className="px-3 py-2.5 flex flex-col gap-0.5">
            <span className="telemetry !text-[8px]">Pollution idx</span>
            <span className="readout text-sm text-amber">{s.pollutionIndex}</span>
          </div>
        </div>

        <div>
          <div className="telemetry mb-2">90-day composite trend</div>
          <TrendSpark id={s.id} />
        </div>

        <div className="flex flex-col gap-4">
          <MetricRow label={`Air quality — AQI (${air.label})`} value={s.aqi} max={300} color={TONE_HEX[air.tone]} />
          <MetricRow label="PM2.5 · µg/m³" value={s.pm25} max={150} color={TONE_HEX.cyan} />
          <MetricRow label="PM10 · µg/m³" value={s.pm10} max={250} color={TONE_HEX.cyan} />
          <MetricRow label="Industrial emission load" value={s.industrialEmissions} max={100} color={TONE_HEX.coral} />
          <MetricRow label="Water quality index" value={s.waterQuality} max={100} color="#4f9dde" />
          <MetricRow label="Biodiversity intactness" value={s.biodiversity} max={100} color={TONE_HEX.emerald} />
          <MetricRow label="Environmental risk exposure" value={s.climateRisk} max={100} color={TONE_HEX.amber} />
        </div>

        <div className="glass rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="grid place-items-center w-5 h-5 rounded bg-emerald/10 border border-emerald/30 text-emerald text-[9px] font-bold">Æ</span>
            <span className="telemetry telemetry-bright">AI read</span>
          </div>
          <p className="text-[13px] leading-relaxed text-ink-dim font-light">
            {s.name} is running {s.tempAnomaly.toFixed(2)} °C above its climate baseline.{" "}
            {s.aqi > 150
              ? "Air quality is the dominant stressor — winter inversions push PM2.5 well past WHO guidance."
              : s.industrialEmissions > 65
                ? "Industrial emissions dominate the signal — metallurgy and power load drive most of the score deficit."
                : s.waterQuality < 45
                  ? "Water-system strain leads — salinity and abstraction pressure warrant close monitoring."
                  : s.climateRisk > 70
                    ? "Heat, drought and desertification exposure are the leading risks for this region."
                    : "No single critical stressor — the long-term warming trend is the primary signal to watch."}
          </p>
          <a
            href={`/assistant?q=${encodeURIComponent(`Risk outlook for ${s.name}`)}`}
            className="inline-flex items-center gap-1.5 mt-3 text-[12px] font-medium text-emerald hover:gap-2.5 transition-all"
          >
            Full risk outlook
            <svg viewBox="0 0 16 16" className="w-3 h-3" fill="none" aria-hidden>
              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
        </div>
      </div>
    </motion.aside>
  );
});
