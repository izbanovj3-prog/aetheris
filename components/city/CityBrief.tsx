/* City Action Brief — the "Act" surface.
   A server component on purpose: no scroll-reveal, no client state, so
   the whole sheet is in the SSR output and prints, screenshots and
   shares intact. Laid out to be read by a city official, not an
   engineer — one screen, plain language, explicit about what is
   measured and what is a planning estimate. */

import Link from "next/link";
import { buildBrief } from "@/lib/brief";
import { LAYER_ORIGIN } from "@/lib/data";
import { OriginBadge, SourceNote } from "@/components/ui/primitives";

const STATUS_TONE: Record<string, string> = {
  critical: "text-coral border-coral/30 bg-coral/[0.07]",
  elevated: "text-amber border-amber/30 bg-amber/[0.07]",
  monitored: "text-cyan border-cyan/30 bg-cyan/[0.07]",
  recovering: "text-emerald border-emerald/30 bg-emerald/[0.07]",
};

/** Matches OriginBadge's shape so the provenance grammar reads the same
 *  everywhere: this figure is a planning estimate, not a measurement. */
function IndicativeBadge() {
  const note =
    "Indicative, not measured — an order-of-magnitude planning range drawn from published practice elsewhere, not an outcome observed in this city and not a prediction for it.";
  return (
    <span
      role="note"
      tabIndex={0}
      title={note}
      aria-label={`Indicative — ${note}`}
      className="telemetry !text-[9px] inline-flex items-center gap-1.5 rounded-full border px-2 py-[3px] cursor-help align-middle whitespace-nowrap text-amber border-amber/30 bg-amber/[0.07]"
    >
      <span className="w-1.5 h-1.5 rounded-full border border-current opacity-70" />
      Indicative
    </span>
  );
}

export default function CityBrief({ id }: { id: string }) {
  const brief = buildBrief(id);
  if (!brief) return null;
  const { station: s, hotspot, stressorLabel, basis, severity, status, interventions } = brief;

  return (
    <section className="brief-sheet max-w-3xl mx-auto px-6 pt-32 pb-20">
      {/* ── Masthead ─────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <span className="telemetry telemetry-bright">City action brief</span>
        <span
          className={`telemetry !text-[9px] inline-flex items-center gap-1.5 rounded-full border px-2 py-[3px] capitalize ${STATUS_TONE[status]}`}
        >
          {status}
        </span>
      </div>

      <h1 className="font-[family-name:var(--font-syne)] font-bold tracking-tight text-4xl sm:text-5xl">
        {s.name}
      </h1>
      <p className="text-ink-dim font-light mt-2">
        {s.region} region · {s.lat.toFixed(2)}°N {s.lon.toFixed(2)}°E · population{" "}
        {s.population.toLocaleString("en-US")}
      </p>

      {/* ── The finding ──────────────────────────────────────── */}
      <div className="glass panel-glow rounded-2xl p-6 sm:p-7 mt-8">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <span className="telemetry">Primary stressor</span>
          <span className="telemetry">
            Severity {severity}/100
          </span>
        </div>
        <h2 className="font-[family-name:var(--font-syne)] font-bold text-2xl mb-3">
          {stressorLabel}
        </h2>
        <p className="text-ink-dim font-light leading-relaxed">{basis}</p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-5 mt-6 pt-5 border-t border-line">
          {[
            { label: "Air quality", value: s.aqi, unit: "AQI", origin: LAYER_ORIGIN.air },
            { label: "Water quality", value: s.waterQuality, unit: "WQI", origin: LAYER_ORIGIN.water },
            { label: "Industrial load", value: s.industrialEmissions, unit: "IEI", origin: LAYER_ORIGIN.industrial },
            { label: "Environmental risk", value: s.climateRisk, unit: "ERI", origin: LAYER_ORIGIN.risk },
          ].map((m) => (
            <div key={m.label} className="flex flex-col gap-1.5">
              <span className="readout text-2xl">{m.value}</span>
              <span className="telemetry leading-tight">{m.label}</span>
              <OriginBadge origin={m.origin} className="self-start" />
            </div>
          ))}
        </div>
      </div>

      {/* ── Ranked interventions ─────────────────────────────── */}
      <div className="flex items-center gap-3 mt-12 mb-5">
        <h2 className="font-[family-name:var(--font-syne)] font-bold text-2xl">
          Recommended actions
        </h2>
        <SourceNote
          source={`Rule-based lookup keyed on the "${stressorLabel}" stressor, ordered by this city's own readings. Not an AI recommendation and not a model output — see lib/brief.ts for the table.`}
        />
      </div>

      <ol className="flex flex-col gap-5">
        {interventions.map((iv, i) => (
          <li key={iv.title} className="glass rounded-2xl p-6 flex flex-col gap-3">
            <div className="flex items-baseline gap-3">
              <span className="readout text-ink-faint text-sm shrink-0">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="font-[family-name:var(--font-syne)] font-bold text-lg leading-snug">
                {iv.title}
              </h3>
            </div>

            <p className="text-ink-dim font-light leading-relaxed text-[15px]">{iv.action}</p>
            <p className="text-ink-faint font-light leading-relaxed text-[14px]">
              <span className="text-ink-dim">Why: </span>
              {iv.rationale}
            </p>

            <div className="grid sm:grid-cols-3 gap-4 pt-3 border-t border-line">
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <span className="telemetry flex items-center gap-2">
                  Expected effect
                  <IndicativeBadge />
                </span>
                <span className="text-[14px] text-ink font-light">{iv.impact}</span>
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="telemetry">First effect</span>
                <span className="text-[14px] text-ink font-light">{iv.horizon}</span>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="telemetry">Owner</span>
              <span className="text-[14px] text-ink-dim font-light">{iv.owner}</span>
            </div>
          </li>
        ))}
      </ol>

      {/* ── Provenance ───────────────────────────────────────── */}
      <div className="glass rounded-2xl p-6 mt-10 flex flex-col gap-3">
        <span className="telemetry telemetry-bright">How to read this brief</span>
        <ul className="flex flex-col gap-2 text-[14px] text-ink-dim font-light leading-relaxed">
          <li>
            <span className="text-ink">Air quality is measured.</span> AQI and its
            components come from Open-Meteo / CAMS at page load. Water, industrial
            load and environmental risk are a modeled regional baseline — indicative,
            not measured.
          </li>
          <li>
            <span className="text-ink">The actions are a lookup, not a forecast.</span>{" "}
            Each stressor maps to a fixed table of interventions written from
            published practice; the ordering reflects this city's readings.
          </li>
          <li>
            <span className="text-ink">Effect ranges are planning figures.</span>{" "}
            They describe what comparable measures achieved elsewhere. They are not
            outcomes observed in {s.name} and not commitments.
          </li>
        </ul>
      </div>

      <div className="flex flex-wrap gap-4 mt-8 brief-noprint">
        <Link
          href={`/city/${s.id}/`}
          className="glass border border-line-bright rounded-xl px-5 py-3 text-sm text-ink hover:border-emerald/40 hover:text-emerald transition-colors duration-300"
        >
          ← Full city readings
        </Link>
        <Link
          href="/map/"
          className="glass border border-line-bright rounded-xl px-5 py-3 text-sm text-ink hover:border-emerald/40 hover:text-emerald transition-colors duration-300"
        >
          Open the Atlas
        </Link>
        {hotspot && (
          <Link
            href="/dashboard/"
            className="glass border border-line-bright rounded-xl px-5 py-3 text-sm text-ink hover:border-emerald/40 hover:text-emerald transition-colors duration-300"
          >
            Hotspot registry
          </Link>
        )}
      </div>

      <p className="telemetry mt-8">
        Aetheris · aetherisearth.live/city/{s.id}/brief
      </p>
    </section>
  );
}
