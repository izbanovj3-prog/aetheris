import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { Footer } from "@/components/chrome/Footer";
import {
  GlassCard,
  GlowButton,
  OriginBadge,
  SourceNote,
  TelemetryTag,
} from "@/components/ui/primitives";
import { LAYERS, LAYER_ORIGIN, networkStats, type LayerKey } from "@/lib/data";
import { getDict } from "@/lib/i18n";
import { SEED_REPORTS } from "@/lib/reports";

// Same copy the homepage renders — single source, no duplicated strings.
const DICT = getDict("en");

/* ─────────────────────────────────────────────────────────────
   AETHERIS · Oxford Saïd Global Climate Tech Challenge 2026
   Standalone competition landing page. Self-contained: reuses the
   platform's design tokens and shared components, reads no new data
   source, and is intentionally outside the main app navigation.
   Reached only via a single footer link (Company column).
   ───────────────────────────────────────────────────────────── */

export const metadata: Metadata = {
  title: "Aral Sea Early Warning — Water Crisis Intelligence",
  description:
    "How Aetheris's Water Quality layer turns into an early-warning system for the Aral Sea basin water crisis. Submitted to the Oxford Saïd Global Climate Tech Challenge 2026.",
  // Standalone page — self-canonical, no locale variants (EN only).
  alternates: { canonical: "/oxford-challenge/" },
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

/* The site's shared <Reveal> renders at opacity:0 and only fades in once
   framer-motion's whileInView fires. On the rest of the site that's fine —
   people scroll. On a judge-facing submission page it is a liability:
   verified in headed Chrome that with JS disabled the entire page body
   renders blank, and with JS enabled but no scrolling (exactly what
   print-to-PDF and full-page screenshot capture do) everything below the
   hero is blank, including the Known limitations block.

   So this page renders its content unconditionally. Block is a drop-in
   replacement — same layout, same props — minus the scroll-gated fade.
   Scoped here deliberately: changing the shared Reveal would alter every
   other page on the site. */
function Block({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
  /** Accepted and ignored — kept so the call sites read like Reveal's. */
  index?: number;
}) {
  return className ? <div className={className}>{children}</div> : <>{children}</>;
}

/* Local copies of SectionHeading and Pillars for the same reason: both
   wrap their content in the shared Reveal, so on this page they'd print
   blank. Same markup and the same dictionary copy — only the scroll-gated
   fade is dropped. Editing the shared components instead would change the
   homepage and every other surface. */
function Heading({ tag, title, lede }: { tag: string; title: ReactNode; lede?: string }) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <TelemetryTag tone="emerald">
          <span className="w-1 h-1 rounded-full bg-emerald" />
          {tag}
        </TelemetryTag>
      </div>
      <h2 className="font-[family-name:var(--font-syne)] font-bold text-3xl sm:text-4xl lg:text-5xl leading-[1.08] tracking-tight max-w-2xl">
        {title}
      </h2>
      {lede && (
        <p className="text-ink-dim text-base sm:text-lg leading-relaxed max-w-xl font-light">
          {lede}
        </p>
      )}
    </div>
  );
}

/* Same reasoning again, and this one matters most: the shared StatReadout
   wraps its number in a motion.span (opacity 0 until in view) and runs a
   count-up that *arms itself back to 0* while off-screen. Measured on this
   page: with JS on and no scrolling the three WQI figures render "0 0 0"
   and are invisible; with JS off they hold the right values but at
   opacity 0. Either way the headline data of the submission is lost in a
   PDF. This renders the number flat — no count-up, no fade. */
function Stat({ value, label, source }: { value: number; label: string; source: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="readout text-3xl sm:text-4xl font-medium text-amber">{value}</span>
      <span className="telemetry">
        {label}
        <SourceNote source={source} className="ml-1.5" />
      </span>
    </div>
  );
}

const PILLAR_ACCENTS = ["from-cyan/60", "from-emerald/60", "from-atmos/60"];

/** Sense → Reason → Act, reading the same dict.pillars copy the homepage uses. */
function HowItWorks() {
  const p = DICT.pillars;
  const readings = NET.dailyReadings.toLocaleString("en-US");
  return (
    <section className="max-w-6xl mx-auto px-6 pt-28">
      <Heading
        tag={p.tag}
        title={
          <>
            {p.titleA}
            <span className="display-gradient">{p.titleAccent}</span>
          </>
        }
        lede={p.lede}
      />
      <div className="grid md:grid-cols-3 gap-5 mt-14">
        {p.items.map((item, i) => (
          <GlassCard
            key={item.title}
            className="group p-7 h-full relative overflow-hidden transition-colors duration-500 hover:border-line-bright"
          >
            <div
              className={`absolute top-0 left-0 right-0 h-px bg-gradient-to-r ${PILLAR_ACCENTS[i]} to-transparent`}
            />
            <span className="readout text-ink-faint text-sm">
              {String(i + 1).padStart(2, "0")}
            </span>
            <h3 className="font-[family-name:var(--font-syne)] font-bold text-2xl mt-3 mb-3 group-hover:text-emerald transition-colors duration-500">
              {item.title}
            </h3>
            <p className="text-ink-dim leading-relaxed text-[15px] font-light">
              {item.body.replace("{readings}", readings)}
            </p>
          </GlassCard>
        ))}
      </div>
    </section>
  );
}

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
        <Block className="flex justify-center">
          <TelemetryTag tone="cyan">
            <span className="w-1 h-1 rounded-full bg-cyan" />
            Oxford Saïd · Global Climate Tech Challenge 2026
          </TelemetryTag>
        </Block>
        <Block index={1}>
          <h1 className="font-[family-name:var(--font-syne)] font-bold tracking-tight text-4xl sm:text-5xl lg:text-6xl leading-[1.06] mt-6">
            Aral Sea Early Warning
            <br />
            <span className="display-gradient">Water Crisis Intelligence</span>
          </h1>
        </Block>
        <Block index={2}>
          <p className="text-ink-dim text-lg font-light leading-relaxed max-w-2xl mx-auto mt-6">
            Aetheris already monitors Kazakhstan's water quality region by region.
            Pointed at the Aral Sea basin, that same Water Quality layer becomes an
            early-warning system for the world's most-cited water-scarcity collapse.
          </p>
        </Block>
        <Block index={3} className="flex justify-center gap-4 mt-9 flex-wrap">
          <GlowButton href="/map">View live data</GlowButton>
          <GlowButton href="/contact" variant="ghost">
            Talk to the team
          </GlowButton>
        </Block>
      </section>

      {/* 2 ── Problem + WQI stat cards ───────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 pt-28">
        <Heading
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
            <Block key={s.city} index={i}>
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
                <Stat
                  value={s.wqi}
                  label="Water Quality Index · 0–100"
                  source="Aetheris modeled water-quality baseline · Aral Sea basin (reference figure)"
                />
              </GlassCard>
            </Block>
          ))}
        </div>
      </section>

      {/* 3 ── How it works: Sense → Reason → Act ─────────────── */}
      <HowItWorks />

      {/* 4 ── Proof ──────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 pt-28">
        <Block>
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
        </Block>
      </section>

      {/* 5 ── Roadmap ────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 pt-28">
        <Block>
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
        </Block>
      </section>

      {/* 6 ── Known limitations ──────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 pt-28">
        <Block>
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
                    Community reports are a {PILOT_REPORTS}-report pilot feed.
                  </span>{" "}
                  Illustrative entries from {PILOT_CONTRIBUTORS} contributors, not a
                  live user base. Reports you submit are real, but persist only to
                  your own browser — there is no backend yet.
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
        </Block>
      </section>

      {/* 7 ── Multilingual access ────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 pt-28">
        <Block>
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
        </Block>
      </section>

      {/* 8 ── Footer CTA ─────────────────────────────────────── */}
      <section className="relative max-w-3xl mx-auto px-6 pt-28 pb-4 text-center">
        <Block>
          <p className="text-ink-dim text-lg font-light leading-relaxed">
            Built by {TEAM_LINE} for the{" "}
            <span className="text-ink">
              Oxford Saïd Global Climate Tech Challenge 2026
            </span>
            .
          </p>
        </Block>
        <Block index={1} className="flex justify-center mt-7">
          <Link
            href="/contact"
            className="telemetry telemetry-bright link-sweep hover:text-emerald transition-colors duration-300"
          >
            Contact the team →
          </Link>
        </Block>
      </section>

      <Footer />
    </main>
  );
}
