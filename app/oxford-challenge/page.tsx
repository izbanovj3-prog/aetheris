import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/chrome/Footer";
import { Pillars } from "@/components/landing/Sections";
import {
  GlassCard,
  GlowButton,
  Reveal,
  SectionHeading,
  StatReadout,
  TelemetryTag,
} from "@/components/ui/primitives";

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

// TODO: replace with the real team member names before submission.
const TEAM = "the Aetheris team";

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
                  It's not a mockup. It's running.
                </h2>
                <p className="text-ink-dim font-light leading-relaxed max-w-md">
                  The Aral basin figures above come from the same Water Quality layer
                  that ships on the live platform today — one of five environmental
                  layers over every Kazakhstan region. Open the Atlas and read the
                  water layer for yourself.
                </p>
                <GlowButton href="/map" className="mt-1">
                  View live data
                </GlowButton>
              </div>
              <div className="flex flex-col gap-4">
                {[
                  "Water Quality (WQI)",
                  "Air Quality (AQI)",
                  "Industrial Load (IEI)",
                  "Biodiversity (BII)",
                  "Environmental Risk (ERI)",
                ].map((layer, i) => (
                  <div
                    key={layer}
                    className="flex items-center gap-3 border-b border-line pb-3"
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${i === 0 ? "bg-cyan" : "bg-ink-faint"}`}
                      style={
                        i === 0
                          ? { boxShadow: "0 0 10px var(--color-cyan)" }
                          : undefined
                      }
                    />
                    <span
                      className={`text-sm font-light ${i === 0 ? "text-ink" : "text-ink-faint"}`}
                    >
                      {layer}
                    </span>
                    {i === 0 && (
                      <span className="telemetry telemetry-bright ml-auto">
                        This story
                      </span>
                    )}
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

      {/* 6 ── Footer CTA ─────────────────────────────────────── */}
      <section className="relative max-w-3xl mx-auto px-6 pt-28 pb-4 text-center">
        <Reveal>
          <p className="text-ink-dim text-lg font-light leading-relaxed">
            Built by {TEAM} for the{" "}
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
