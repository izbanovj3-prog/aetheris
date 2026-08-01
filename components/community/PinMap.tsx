"use client";

import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

/* ─────────────────────────────────────────────────────────────
   A small map with one draggable pin.

   Step 2 of the report flow and the event form both need the same thing:
   an automatic position that the person can correct by hand. That matters
   more than it sounds — a photo taken from a window or a hillside puts
   the GPS fix somewhere the problem is not, and a report pinned to the
   wrong bank of a river is a report about the wrong place.

   Style is the same CARTO raster + self-hosted glyph setup the Atlas
   uses, so no new tile or font dependency arrives with it.
   ───────────────────────────────────────────────────────────── */

const STYLE: maplibregl.StyleSpecification = {
  version: 8,
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
      paint: { "raster-opacity": 0.7, "raster-contrast": 0.05 },
    },
  ],
};

function pinElement(): HTMLDivElement {
  const el = document.createElement("div");
  el.style.cssText =
    "width:28px;height:28px;cursor:grab;display:grid;place-items:center;";
  el.innerHTML =
    '<svg viewBox="0 0 24 24" width="28" height="28" fill="none" aria-hidden="true">' +
    '<circle cx="12" cy="12" r="10" fill="rgba(45,226,166,0.18)"/>' +
    '<circle cx="12" cy="12" r="5.5" fill="#2de2a6" stroke="#04080b" stroke-width="1.6"/>' +
    "</svg>";
  return el;
}

export function PinMap({
  lat,
  lon,
  onChange,
  height = 220,
  label = "Drag the pin to correct the location",
}: {
  lat: number;
  lon: number;
  onChange: (lat: number, lon: number) => void;
  height?: number;
  label?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markerRef = useRef<maplibregl.Marker | null>(null);
  // Held in a ref so the map is built once: putting onChange in the effect's
  // dependency list would tear the map down on every parent render.
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: STYLE,
      center: [lon, lat],
      zoom: 12,
      attributionControl: false,
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    map.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-right");
    mapRef.current = map;

    const marker = new maplibregl.Marker({ element: pinElement(), draggable: true })
      .setLngLat([lon, lat])
      .addTo(map);
    marker.on("dragend", () => {
      const p = marker.getLngLat();
      onChangeRef.current(p.lat, p.lng);
    });
    markerRef.current = marker;

    // Tapping the map moves the pin too. On a phone, dragging a 28px target
    // is fiddly and tapping where you mean is not.
    map.on("click", (e) => {
      marker.setLngLat(e.lngLat);
      onChangeRef.current(e.lngLat.lat, e.lngLat.lng);
    });

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // Mount-only: `lat`/`lon` seed the initial view, and the effect below
    // handles every later change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Follow external moves (the "use my location" button), without fighting
  // a drag the user is in the middle of.
  useEffect(() => {
    const marker = markerRef.current;
    const map = mapRef.current;
    if (!marker || !map) return;
    const cur = marker.getLngLat();
    if (Math.abs(cur.lat - lat) < 1e-7 && Math.abs(cur.lng - lon) < 1e-7) return;
    marker.setLngLat([lon, lat]);
    map.easeTo({ center: [lon, lat], duration: 420 });
  }, [lat, lon]);

  return (
    <div>
      <div
        className="relative rounded-xl overflow-hidden border border-line"
        style={{ height }}
      >
        {/* Inline position/inset: MapLibre's unlayered `.maplibregl-map
            { position: relative }` beats Tailwind's layered `.absolute`,
            which collapses the container to the 300px canvas default. */}
        <div ref={containerRef} style={{ position: "absolute", inset: 0 }} />
      </div>
      <p className="telemetry !text-[9px] mt-2">{label}</p>
    </div>
  );
}
