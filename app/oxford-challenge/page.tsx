import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/chrome/Footer";
import { Pillars } from "@/components/landing/Sections";
import {
  GlassCard,
  GlowButton,
  OriginBadge,
  Reveal,
  SectionHeading,
  StatReadout,
  TelemetryTag,
} from "@/components/ui/primitives";
import { LAYERS, LAYER_ORIGIN, networkStats, type LayerKey } from "@/lib/data";
import { SEED_REPORTS } from "@/lib/reports";
import { SITE } from "@/lib/site";

/* ─────────────────────────────────────────────────────────────
   AETHERIS · Oxford Saïd Global Climate Tech Challenge 2026
   Standalone competition landing page. Self-contained: reuses the
   platform's design tokens and shared components, reads no new data
   source, and is intentionally outside the main app navigation.
   Reached only via a single footer link (Company column).
   ───────────────────────────────────────────────────────────── */

const OG_TITLE = "Aral Sea Early Warning — Water Crisis Intelligence";
const OG_DESCRIPTION =
  "Kazakhstan's Aral basin reads critical on every water measure — Aralsk WQI 20, Kyzylorda 32, Zhanaozen 38. Aetheris turns its Water Quality layer into an early-warning system for the communities of the Priaralye.";

export const metadata: Metadata = {
  title: OG_TITLE,
  description:
    "How Aetheris's Water Quality layer turns into an early-warning system for the Aral Sea basin water crisis. Submitted to the Oxford Saïd Global Climate Tech Challenge 2026.",
  // Standalone page — self-canonical, no locale variants (EN only).
  alternates: { canonical: "/oxford-challenge/" },
  // Without these the route inherits the homepage's OG copy from the root
  // layout, so every share of this page read "Kazakhstan Environmental
  // Intelligence" instead of the Aral Sea story.
  openGraph: {
    type: "article",
    siteName: SITE.name,
    title: OG_TITLE,
    description: OG_DESCRIPTION,
    url: `${SITE.url}/oxford-challenge/`,
    locale: SITE.locale,
  },
  twitter: {
    card: "summary_large_image",
    title: OG_TITLE,
    description: OG_DESCRIPTION,
  },
};

// Aral Sea basin — Water Quality Index reference figures. WQI is 0–100,
// higher is healthier; the whole basin sits in the critical band. These
// are Aetheris's modeled water baseline (water is not a live feed), shown
// here as static reference numbers.
const BASIN_WQI = [
  { city: "Aralsk", region: "Kyzylorda oblast", wqi: 20 },
  { city: "Kyzylorda", region: "Kyzylorda oblast", wqi: 32 },
  { city: "Zhanaozen", region: "Mangystau oblast", wqi: 38 },
] as const;

// Ordered for the proof panel: the layer this page is about goes first.
const LAYER_ROWS: Array<{ key: LayerKey; label: string }> = [
  { key: "water", label: "Water Quality (WQI)" },
  { key: "air", label: "Air Quality (AQI)" },
  { key: "industrial", label: "Industrial Load (IEI)" },
  { key: "biodiversity", label: "Biodiversity (BII)" },
  { key: "risk", label: "Environmental Risk (ERI)" },
];

// Real figures, read from the code that actually backs them — never typed by
// hand, so the limitations block can't drift from what the platform ships.
const NET = networkStats();
const PILOT_REPORTS = SEED_REPORTS.length;
const PILOT_CONTRIBUTORS = new Set(SEED_REPORTS.map((r) => r.author)).size;

// Submission team. Names are transliterated to Latin for this English-language
// page (Жанболат Избанов, Александр Токарев, Инсар Туртаев).
// TODO: add each member's role alongside their name before submission —
// deliberately left blank rather than guessed.
const TEAM = ["Zhanbolat Izbanov", "Alexander Tokarev", "Insar Turtaev"];
const TEAM_LINE = `${TEAM.slice(0, -1).join(", ")} and ${TEAM[TEAM.length - 1]}`;

export default function OxfordChallengePage() {
  return (
    <main className="flex-1">
      {/* 1 ── Hero ───────────────────────────────────────────── */}
      <section className="relative max-w-4xl mx-auto px-6 pt-40 pb-4 text-center">
        <div
          className="absolute inset-x-0 top-16 h-[420px] -z-10 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 55% 60% at 50% 35%, rgba(79,157,222,0.12), transparent 65%)",
          }}
        />
        <Reveal className="flex justify-center">
          <TelemetryTag tone="cyan">
            <span className="w-1 h-1 rounded-full bg-cyan" />
            Oxford Saïd · Global Climate Tech Challenge 2026
          </TelemetryTag>
        </Reveal>
        <Reveal index={1}>
          <h1 className="font-[family-name:var(--font-syne)] font-bold tracking-tight text-4xl sm:text-5xl lg:text-6xl leading-[1.06] mt-6">
            Aral Sea Early Warning
            <br />
            <span className="display-gradient">Water Crisis Intelligence</span>
          </h1>
        </Reveal>
        <Reveal index={2}>
          <p className="text-ink-dim text-lg font-light leading-relaxed max-w-2xl mx-auto mt-6">
            Aetheris already monitors Kazakhstan's water quality region by region.
            Pointed at the Aral Sea basin, that same Water Quality layer becomes an
            early-warning system for the world's most-cited water-scarcity collapse.
          </p>
        </Reveal>
        <Reveal index={3} className="flex justify-center gap-4 mt-9 flex-wrap">
          <GlowButton href="/map">View live data</GlowButton>
          <GlowButton href="/contact" variant="ghost">
            Talk to the team
          </GlowButton>
        </Reveal>
      </section>

      {/* 2 ── Problem + WQI stat cards ───────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 pt-28">
        <SectionHeading
          tag="The crisis"
          title={
            <>
              A sea that lost 90% of its volume —
              <span className="display-gradient"> and the water it fed.</span>
            </>
          }
          lede="Six decades of irrigation drawdown on the Syr Darya and Amu Darya turned the Aral Sea into salt flat and dust. Communities in the Priaralye now draw from water that reads critical across the basin — but no one gets warned before it turns."
        />
        <div className="grid sm:grid-cols-3 gap-5 mt-14">
          {BASIN_WQI.map((s, i) => (
            <Reveal key={s.city} index={i}>
              <GlassCard className="p-6 h-full flex flex-col gap-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-col">
                    <span className="font-[family-name:var(--font-syne)] font-bold text-xl">
                      {s.city}
                    </span>
                    <span className="telemetry mt-1">{s.region}</span>
                  </div>
                  <TelemetryTag tone="coral">Critical</TelemetryTag>
                </div>
                <OriginBadge origin={LAYER_ORIGIN.water} className="self-start" />
                <StatReadout
                  value={s.wqi}
                  label="Water Quality Index · 0–100"
                  tone="amber"
                  source="Aetheris modeled water-quality baseline · Aral Sea basin (reference figure)"
                />
              </GlassCard>
            </Reveal>
          ))}
        </div>
      </section>

      {/* 3 ── How it works: Sense → Reason → Act ─────────────── */}
      <Pillars />

      {/* 4 ── Proof ──────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 pt-28">
        <Reveal>
          <GlassCard bright ticks className="scanline p-8 sm:p-12">
            <div className="grid lg:grid-cols-[1.3fr_1fr] gap-10 items-center">
              <div className="flex flex-col items-start gap-5">
                <TelemetryTag tone="emerald">
                  <span className="w-1 h-1 rounded-full bg-emerald" />
                  Live proof
                </TelemetryTag>
                <h2 className="font-[family-name:var(--font-syne)] font-bold text-3xl sm:text-4xl leading-tight">
                  What's live, and what isn't.
                </h2>
                <p className="text-ink-dim font-light leading-relaxed max-w-md">
                  Air quality readings are live today — fetched per city from
                  Open-Meteo's CAMS satellite and forecast models, refreshed hourly.
                  Water quality is currently a deterministic regional baseline, not a
                  sensor feed; real-time ingestion is the next build milestone. Every
                  number on the platform carries the badge that says which it is.
                </p>
                <GlowButton href="/map" className="mt-1">
                  View live data
                </GlowButton>
              </div>
              {/* Layer provenance, read straight from LAYER_ORIGIN so this list
                  can never disagree with the badges on the rest of the site. */}
              <div className="flex flex-col gap-4">
                {LAYER_ROWS.map(({ key, label }) => (
                  <div
                    key={key}
                    className="flex items-center gap-3 border-b border-line pb-3"
                  >
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{
                        background: LAYERS[key].color,
                        boxShadow: `0 0 10px ${LAYERS[key].color}`,
                      }}
                    />
                    <span className="text-sm font-light text-ink">{label}</span>
                    <OriginBadge origin={LAYER_ORIGIN[key]} className="ml-auto" />
                  </div>
                ))}
              </div>
            </div>
          </GlassCard>
        </Reveal>
      </section>

      {/* 5 ── Roadmap ────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 pt-28">
        <Reveal>
          <GlassCard className="p-8 sm:p-10 flex flex-col items-start gap-5">
            <TelemetryTag tone="amber">
              <span className="w-1 h-1 rounded-full bg-amber" />
              Planned · not yet live
            </TelemetryTag>
            <h2 className="font-[family-name:var(--font-syne)] font-bold text-2xl sm:text-3xl leading-tight max-w-2xl">
              Next: SMS / USSD alerts for off-grid communities.
            </h2>
            <p className="text-ink-dim font-light leading-relaxed max-w-2xl">
              The fishing and farming communities of the Priaralye are exactly the
              people least likely to be watching a dashboard. The next build pushes
              WQI threshold alerts over SMS and USSD — no smartphone, no data plan
              required — driven by the same pipeline you see above. This step is on
              the roadmap, not yet shipped.
            </p>
          </GlassCard>
        </Reveal>
      </section>

      {/* 6 ── Known limitations ──────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 pt-28">
        <Reveal>
          <GlassCard className="p-8 sm:p-10">
            <div className="flex items-center gap-3 mb-6">
              <h2 className="font-[family-name:var(--font-syne)] font-bold text-2xl">
                Known limitations
              </h2>
              <TelemetryTag>As of this submission</TelemetryTag>
            </div>
            <ul className="flex flex-col gap-4">
              {[
                <>
                  <span className="text-ink">One of five layers is live.</span>{" "}
                  Air quality (AQI, PM2.5, PM10, NO₂) and weather come from
                  Open-Meteo / CAMS at page load. Water, biodiversity, industrial
                  load and environmental risk are a deterministic regional
                  baseline — indicative, not measured.
                </>,
                <>
                  <span className="text-ink">
                    The Aral WQI figures above are modeled, not sampled.
                  </span>{" "}
                  They encode known basin conditions rather than readings from
                  instruments in the water. Treat them as a demonstration of the
                  pipeline, not as survey data.
                </>,
                <>
                  <span className="text-ink">
                    Community reports are corroborated, never verified.
                  </span>{" "}
                  Submissions persist to a shared Postgres database and are
                  visible to every visitor in any browser, rate-limited to five
                  per hour per device. Everything arrives as &ldquo;awaiting
                  review&rdquo;; when two or more different devices report the
                  same category in the same city within 72 hours, that group
                  moves to &ldquo;corroborated&rdquo;. That is independent people
                  describing the same thing — not proof they are right, and no
                  instrument checks them. Nothing is ever auto-promoted to
                  &ldquo;verified&rdquo;, and there is still no human moderator.
                  The feed also carries {PILOT_REPORTS} clearly marked
                  illustrative entries from {PILOT_CONTRIBUTORS} example
                  contributors.
                </>,
                <>
                  <span className="text-ink">Shipped vs roadmap.</span> Live now:{" "}
                  {NET.cities} city stations across {NET.regions} regions, the Atlas,
                  dashboard and assistant. Not yet built: real-time water sensor
                  ingestion and the SMS/USSD alerting described above.
                </>,
              ].map((item, i) => (
                <li key={i} className="flex gap-3.5 text-ink-dim font-light leading-relaxed">
                  <span className="readout text-ink-faint text-sm shrink-0 pt-0.5">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </GlassCard>
        </Reveal>
      </section>

      {/* 7 ── Multilingual access ────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 pt-28">
        <Reveal>
          <GlassCard className="p-8 sm:p-10 flex flex-col items-start gap-5">
            <TelemetryTag tone="cyan">
              <span className="w-1 h-1 rounded-full bg-cyan" />
              Built for the people it's about
            </TelemetryTag>
            <h2 className="font-[family-name:var(--font-syne)] font-bold text-2xl sm:text-3xl leading-tight max-w-2xl">
              The whole platform speaks Kazakh, Russian and English.
            </h2>
            <p className="text-ink-dim font-light leading-relaxed max-w-2xl">
              Climate tools written only in English exclude the communities living
              the crisis. Every page, index and AI answer on Aetheris is fully
              localized — the Priaralye residents this work is for can read it in
              the language they actually speak, not a translated summary.
            </p>
            <div className="flex flex-wrap gap-3 mt-1">
              <Link
                href="/"
                className="glass border border-line-bright rounded-xl px-4 py-2.5 text-sm text-ink hover:border-emerald/40 hover:text-emerald transition-colors duration-300"
              >
                English
              </Link>
              <Link
                href="/ru/"
                className="glass border border-line-bright rounded-xl px-4 py-2.5 text-sm text-ink hover:border-emerald/40 hover:text-emerald transition-colors duration-300"
              >
                Русский
              </Link>
              <Link
                href="/kk/"
                className="glass border border-line-bright rounded-xl px-4 py-2.5 text-sm text-ink hover:border-emerald/40 hover:text-emerald transition-colors duration-300"
              >
                Қазақша
              </Link>
            </div>
          </GlassCard>
        </Reveal>
      </section>

      {/* 8 ── Footer CTA ─────────────────────────────────────── */}
      <section className="relative max-w-3xl mx-auto px-6 pt-28 pb-4 text-center">
        <Reveal>
          <p className="text-ink-dim text-lg font-light leading-relaxed">
            Built by {TEAM_LINE} for the{" "}
            <span className="text-ink">
              Oxford Saïd Global Climate Tech Challenge 2026
            </span>
            .
          </p>
        </Reveal>
        <Reveal index={1} className="flex justify-center mt-7">
          <Link
            href="/contact"
            className="telemetry telemetry-bright link-sweep hover:text-emerald transition-colors duration-300"
          >
            Contact the team →
          </Link>
        </Reveal>
      </section>

      <Footer />
    </main>
  );
}
