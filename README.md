# AETHERIS — Kazakhstan Environmental Intelligence

A cinematic climate-tech platform: real-time ecological mapping, national analytics, AI environmental analysis, and a citizen-science community — rendered as mission control for Kazakhstan's environment.

## Run

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # static production build → out/ (all routes prerendered)
```

> Node 22+ required. No API keys needed — the map uses MapLibre GL with CARTO dark tiles, map label glyphs are self-hosted from `public/fonts/`, and all environmental data comes from the built-in simulation engine.

## Surfaces

| Route | What it is |
| --- | --- |
| `/` | Cinematic landing — Three.js particle Earth with a Kazakhstan monitoring cluster, scroll storytelling, live telemetry ticker |
| `/map` | Kazakhstan Atlas — MapLibre dark map centred on the country, 5 environmental layers (air / industrial / water / biodiversity / risk), AQI heatmap, labelled city nodes, ecological-hotspot overlay, hover cards, fly-to analytics panel |
| `/dashboard` | Intelligence — temperature-anomaly + AQI trends (custom SVG charts), sustainability gauge, city rankings, AI insights, environmental-hotspot registry |
| `/assistant` | AI environmental analyst — streaming chat grounded in the national data model, with citations. Supports `?q=` deep links |
| `/community` | Field reports with verification states, eco missions, achievements, points, local events |

## Architecture

```
app/               routes (App Router, all static shells)
  opengraph-image  · twitter-image · apple-icon · icon.svg   (generated metadata)
  robots.ts · sitemap.ts · manifest.ts                       (SEO / PWA)
  not-found.tsx · error.tsx · global-error.tsx               (resilience)
components/
  chrome/          Nav, Footer
  ui/              primitives — motion grammar, glass cards, buttons, readouts
  landing/         Hero, Globe (R3F), story sections
  map/             EnvironmentalMap (MapLibre + layer system), AtlasBoot, GlobalPulse, LayerLegend
  dashboard/       custom SVG instrumentation
  assistant/       chat + streaming reveal
  community/       reports, missions, achievements
lib/
  site.ts          single source of truth for metadata, OG, sitemap, manifest
  data.ts          seeded simulation — 28 cities across every region, hotspots, time series
  atlas.ts         live national event feed + country health index
  ai.ts            deterministic reasoning engine — generate() mirrors a streaming
                   LLM signature, so swapping in the Claude API is a drop-in change
public/data/       Natural Earth 110m land polygons (drives the particle globe)
public/fonts/      self-hosted Noto Sans glyph PBFs (map labels, no external CDN)
```

## City data model

Each of the 28 monitored cities (every Kazakh region represented) carries a full
environmental profile: AQI, PM2.5, PM10, NO₂, temperature, humidity, water-quality
index, biodiversity intactness, industrial-emission load, pollution index,
environmental-risk exposure, a composite sustainability score, temperature anomaly
and a 90-day trend. All values are deterministic and seeded, so every surface
(map, dashboard, hero, analyst) reports identical figures for the same city.

Fourteen named ecological hotspots anchor the map to real places — the Aral Sea
basin, Lake Balkhash, the Tengiz/Caspian oil zone, the Semipalatinsk Polygon, the
Temirtau steel belt, Ekibastuz coal complex, Oskemen metallurgy, and steppe-fire
fronts.

## Design system

Defined in `app/globals.css` as Tailwind v4 `@theme` tokens:

- **Palette** — abyss black `#030608`, carbon glass, emerald `#2de2a6`, electric cyan `#4fd8f7`, atmospheric blue `#4f9dde`
- **Type** — Syne (display), Albert Sans (body), IBM Plex Mono (telemetry/readouts)
- **Motion** — one easing family (`cubic-bezier(0.22, 1, 0.36, 1)`), staggered telemetry-style reveals, `prefers-reduced-motion` honoured globally via `MotionConfig`
- **Texture** — glassmorphism panels, corner-tick instrument framing, scanline sweeps, animated film grain
- **A11y** — skip-to-content link, keyboard focus-visible ring, reduced-motion-aware globe and counters

## Going live with real data

Every generator in `lib/data.ts` maps 1:1 to a public feed: Kazhydromet / AirKaz
(air), MODIS-FIRMS (steppe fire), Copernicus (climate), GBIF (biodiversity). To use
Mapbox instead of CARTO tiles, replace the raster source in
`components/map/EnvironmentalMap.tsx` with a Mapbox style URL + token.
