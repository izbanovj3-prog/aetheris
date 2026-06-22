# AETHERIS — Devlog

**Project:** AETHERIS — Kazakhstan Environmental Intelligence.
A climate-tech platform for Kazakhstan: real-time ecological mapping, national analytics, an AI environmental analyst, and a citizen-science community — presented as mission control for the country's environment.

**Stack:** Next.js 16 (App Router, static export), React 19, TypeScript, Tailwind v4, Three.js / React Three Fiber (globe), MapLibre GL (atlas), Framer Motion.

---

## Day 1 — Foundation

Set up the Next.js 16 project with the App Router and configured it for a fully static build (every route prerendered, no server runtime). Laid the geographic base: Natural Earth land polygons that drive the particle globe. Built the first shell of the landing page.

## Day 2 — Map layer system

Started the map's layer system. Designed and built the layer legend, which locked in the five environmental layers the whole app is built around: air, industrial, water, biodiversity, and risk.

## Day 3 — Data engine & first surfaces

The biggest push. Built the deterministic simulation engine — a full environmental profile (AQI, PM2.5/PM10, NO₂, temperature, water quality, biodiversity, emissions, sustainability score, 90-day trends) for 28 cities, one per region of Kazakhstan. All values are seeded, so every screen reports the same numbers. On top of that, built the cinematic landing page with a Three.js particle globe and the analytics dashboard with custom SVG charts (temperature anomaly, AQI trends, city rankings). Also scaffolded the map and AI assistant routes and self-hosted the map label fonts so there's no external CDN dependency — ready to be wired up next.

## Day 4 — Testing

Reviewed and tested the build end to end, checked all routes render correctly in the static export, and validated the data across surfaces.

## Day 5 — Polish & deploy

Finalized the navigation and the design system (color palette, typography, motion, glass/scanline textures). Centralized all site metadata, SEO, and PWA config into a single source. Fixed a URL-parsing edge case, ran the static production build, and deployed.

## Day 6 — Live AQI Map & AI Analyst 🌍🇰🇿

Brought the Kazakhstan Atlas to life and connected it to the AI reasoning engine.

What I built:
- Wired up AQI and PM2.5 data across all 28 monitored cities into the map.
- Implemented the environmental AI layer. The assistant now reads the data model and explains the context behind the numbers — e.g. the heavy winter smog in Almaty caused by temperature inversions.

Challenge: rendering that many environmental data points caused noticeable UI lag on the initial map render. I fixed it by optimizing the data arrays and how layers are loaded so the map paints smoothly.

Next: the Community system, so citizen scientists can log local pollution events and earn contribution points.

---

**The core idea:** everyrhing runs on one deterministic data engine, and tne AI layer mimics a streaming LLM signature. That means swapping the simulation for live feeds(Kazhydromet/AirKaz, MODIS-FIRMS, Copernicus, GBIF) and wiring in a real AI API is a drop-in change - no UI rewrite.
