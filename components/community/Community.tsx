"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  EASE,
  GlassCard,
  Reveal,
  SourceNote,
  TelemetryTag,
} from "@/components/ui/primitives";
import { useLiveStations } from "@/lib/useLiveStations";
import { assistantPrompt, buildAiContext, type AiContext } from "@/lib/aiContext";
import { POINTS } from "@/lib/points";
import {
  CATEGORIES,
  SEED_REPORTS,
  SEVERITIES,
  STATUS_META,
  displayTime,
  getRemoteReports,
  getUserReports,
  namesOrganisation,
  resolveStatus,
  type Report,
  type Tone,
} from "@/lib/reports";
import { AiContextBubble } from "./AiContextBubble";
import { BadgeShowcase } from "./BadgeShowcase";
import { Events } from "./Events";
import { ReportFlow } from "./ReportFlow";
import { StatusChip, StatusLegend } from "./StatusChip";

const TONE_TEXT: Record<Tone, string> = {
  emerald: "text-emerald",
  cyan: "text-cyan",
  amber: "text-amber",
  coral: "text-coral",
  atmos: "text-atmos",
};

const TONE_CHIP: Record<Tone, string> = {
  emerald: "text-emerald border-emerald/30 bg-emerald/[0.06]",
  cyan: "text-cyan border-cyan/30 bg-cyan/[0.06]",
  amber: "text-amber border-amber/30 bg-amber/[0.06]",
  coral: "text-coral border-coral/30 bg-coral/[0.06]",
  atmos: "text-atmos border-atmos/30 bg-atmos/[0.06]",
};

/* ── Sample-data disclosure ───────────────────────────────────
   Aetheris has no accounts and no auth. The seeded feed and the mission
   rail are a mockup of the design, not a record of anyone's activity, and
   they are labelled accordingly. The contributor panel is no longer part
   of that: Eco-Points and badges are now computed from the reports this
   device actually filed, so it shows zero rather than an invented score.
   ───────────────────────────────────────────────────────────── */

/** Real totals of the seeded pilot feed — never hand-typed. */
const PILOT = {
  reports: SEED_REPORTS.length,
  contributors: new Set(SEED_REPORTS.map((r) => r.author)).size,
  corroborated: SEED_REPORTS.filter((r) => r.status === "corroborated").length,
};

function SampleTag({ note, children }: { note: string; children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <TelemetryTag tone="amber">{children}</TelemetryTag>
      <SourceNote source={note} />
    </span>
  );
}

/* ── Missions (still illustrative, out of the 2.0 MVP scope) ─── */

interface Mission {
  id: string;
  title: string;
  desc: string;
  reward: number;
  progress: number;
  total: number;
  joined: boolean;
}

const MISSIONS: Mission[] = [
  { id: "m1", title: "Watershed Watch", desc: "Log 5 water-quality readings from your local waterway this month.", reward: 450, progress: 3, total: 5, joined: true },
  { id: "m2", title: "Canopy Census", desc: "Map 20 street trees with species + condition in your district.", reward: 600, progress: 0, total: 20, joined: false },
  { id: "m3", title: "Night Sky Audit", desc: "Submit 3 light-pollution measurements after 23:00.", reward: 280, progress: 1, total: 3, joined: true },
];

/* The rank-shaped names (Sentinel, Constellation) that used to sit in this
   grid have moved into the rank ladder in lib/points.ts, where the concept
   puts them — keeping them here as well would have been exactly the
   duplicated-nomenclature bug this project has been caught by before.
   What is left is the achievements that are not ranks, with the wording
   that promised a verification step the platform cannot perform removed. */
const ACHIEVEMENTS = [
  { icon: "◬", name: "First Signal", desc: "First report filed", unlocked: true },
  { icon: "❋", name: "Field Naturalist", desc: "25 species logged", unlocked: false },
  { icon: "◈", name: "Stream Keeper", desc: "10 water samples", unlocked: false },
  { icon: "◉", name: "Ground Truth", desc: "50 reports with a live reading beside them", unlocked: false },
];

/* ── AI context, per card ─────────────────────────────────────
   Fetched in the browser from the same feeds the city pages use. Air and
   industrial reports read from the shared live-station subscription, so
   they cost no extra request at all; biodiversity reports make one GBIF
   call each, and there are rarely many on screen. */

function useAiContext(
  report: Report,
  stations: ReturnType<typeof useLiveStations>,
): { context: AiContext | null; loading: boolean } {
  const [context, setContext] = useState<AiContext | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ac = new AbortController();
    let alive = true;
    setLoading(true);
    buildAiContext(report, stations.stations, stations.live, stations.fetchedAt, ac.signal)
      .then((c) => {
        if (!alive) return;
        setContext(c);
        setLoading(false);
      })
      .catch(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
      ac.abort();
    };
  }, [report, stations.stations, stations.live, stations.fetchedAt]);

  return { context, loading };
}

/* ── Report card ──────────────────────────────────────────────── */

function ReportCard({
  r,
  highlight,
  live,
}: {
  r: Report;
  highlight?: boolean;
  live: ReturnType<typeof useLiveStations>;
}) {
  const [votes, setVotes] = useState(r.upvotes);
  const [voted, setVoted] = useState(false);
  const cat = CATEGORIES[r.category];
  const sev = SEVERITIES[r.severity];

  const { context, loading } = useAiContext(r, live);
  // ② is derived: a report shows "AI-контекст добавлен" once real context
  // has actually resolved for it, and not before.
  const status = resolveStatus(r, Boolean(context) && context?.kind !== "none");

  return (
    <GlassCard
      className={`p-6 transition-colors duration-500 ${
        highlight ? "border-emerald/50 shadow-[0_0_28px_-6px_rgba(45,226,166,0.45)]" : "hover:border-line-bright"
      }`}
    >
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex items-center gap-3">
          <span className="grid place-items-center w-9 h-9 rounded-full bg-carbon-3 border border-line-bright text-[10px] font-semibold text-ink-dim">
            {r.initials}
          </span>
          <div>
            <div className="text-sm font-medium flex items-center gap-2 flex-wrap">
              {r.author}
              {r.userCreated && (
                <span className="telemetry !text-[8px] text-emerald border border-emerald/30 rounded-full px-1.5 py-0.5">
                  You
                </span>
              )}
              {/* Seeded illustrative rows carry the mark; real submissions
                  never do, so the two can't be confused either way. */}
              {!r.remote && !r.createdAt && (
                <span
                  title="Illustrative example written to demonstrate the feed — not a real submission."
                  className="telemetry !text-[8px] text-amber border border-amber/30 rounded-full px-1.5 py-0.5 cursor-help"
                >
                  Sample
                </span>
              )}
              {r.remote && (
                <span
                  title="Real submission, stored in the shared database and visible to every visitor."
                  className="telemetry !text-[8px] text-cyan border border-cyan/30 rounded-full px-1.5 py-0.5 cursor-help"
                >
                  Filed
                </span>
              )}
              {r.parentId && (
                <span
                  title="A follow-up update on an earlier report."
                  className="telemetry !text-[8px] text-atmos border border-atmos/30 rounded-full px-1.5 py-0.5 cursor-help"
                >
                  Update
                </span>
              )}
            </div>
            <div className="telemetry !text-[9px] mt-0.5">
              {r.city} · {displayTime(r)}
            </div>
          </div>
        </div>
        <StatusChip status={status} />
      </div>

      <div className="flex items-center gap-2 mb-1.5">
        <span className={`text-sm ${TONE_TEXT[cat.tone]}`}>{cat.glyph}</span>
        <span className="telemetry">{cat.label}</span>
        <span className={`telemetry !text-[9px] border rounded-full px-2 py-0.5 ml-1 ${TONE_CHIP[sev.tone]}`}>
          {sev.label}
        </span>
      </div>
      <h3 className="font-[family-name:var(--font-syne)] font-bold text-lg leading-snug mb-2">
        {r.title}
      </h3>
      <p className="text-[13.5px] text-ink-dim font-light leading-relaxed mb-4">{r.body}</p>

      {/* The report's own words are never altered. When they name an outside
          organisation, this sits beside them so nobody reads the mention as
          involvement or endorsement — the report is unchecked either way. */}
      {namesOrganisation(r) && (
        <div className="flex items-start gap-2.5 rounded-xl border border-amber/30 bg-amber/[0.05] px-3.5 py-2.5 mb-4">
          <span className="text-amber text-sm leading-none mt-0.5 shrink-0" aria-hidden>
            ⚠
          </span>
          <p className="text-[12px] text-ink-dim font-light leading-relaxed">
            <span className="text-amber">Independent report.</span> This account
            names an outside organisation. Aetheris is not affiliated with it, and
            the organisation has neither reviewed nor commented on this report.
          </p>
        </div>
      )}

      {r.photo && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={r.photo}
          alt={`Field photo for ${r.title}`}
          className="w-full max-h-64 object-cover rounded-xl border border-line mb-4"
        />
      )}

      {/* ② AI-контекст — collapsible, sitting under the photo. */}
      <AiContextBubble context={context} loading={loading} />

      {/* ④ / ⑤ — only ever present when an operator recorded them. */}
      {r.forwardedAt && (
        <div className="rounded-xl border border-amber/25 bg-amber/[0.04] px-3.5 py-2.5 mb-4">
          <div className="telemetry !text-[9px] text-amber/80 mb-1">Transfer log</div>
          <p className="text-[12px] text-ink-dim font-light leading-relaxed">
            Passed to {r.forwardedTo} on{" "}
            {new Date(r.forwardedAt).toISOString().slice(0, 10)}. This records that
            the data was sent, and nothing about how it was received or whether
            anything followed.
          </p>
        </div>
      )}
      {r.orgResponse && (
        <div className="rounded-xl border border-coral/25 bg-coral/[0.04] px-3.5 py-2.5 mb-4">
          <div className="telemetry !text-[9px] text-coral/80 mb-1">
            {r.orgResponseOrg}
          </div>
          <p className="text-[12px] text-ink-dim font-light leading-relaxed">
            {r.orgResponse}
          </p>
        </div>
      )}

      <div className="flex items-center gap-3 flex-wrap">
        <button
          type="button"
          onClick={() => {
            setVoted((v) => !v);
            setVotes((v) => (voted ? v - 1 : v + 1));
          }}
          aria-pressed={voted}
          aria-label={voted ? "Remove reaction" : "I see it too"}
          title="I see it too"
          className={`flex items-center gap-2 text-[13px] rounded-full border px-3.5 py-1.5 transition-all duration-300 ${
            voted
              ? "border-emerald/40 text-emerald bg-emerald/[0.07]"
              : "border-line text-ink-dim hover:border-line-bright hover:text-ink"
          }`}
        >
          <span aria-hidden>👁</span>
          <span className="readout">{votes}</span>
        </button>

        {/* Concept 5.2 — hands this specific report to the Analyst that
            already exists on /assistant, rather than building a second
            chat. The deep link is the ?q= the assistant already reads.

            The Russian tree, not the English one: the prompt is written in
            Russian (as the concept writes it, and as this button is
            labelled), and the Analyst answers in the language of the route
            it is opened on. Sending a Russian question to /assistant would
            get an English answer back. */}
        <Link
          href={`/ru/assistant?q=${encodeURIComponent(assistantPrompt(r, context))}`}
          className="flex items-center gap-2 text-[13px] rounded-full border border-line text-ink-dim hover:text-emerald hover:border-emerald/30 px-3.5 py-1.5 transition-colors duration-300"
        >
          <span className="text-[11px] font-bold" aria-hidden>
            Æ
          </span>
          Спросить ИИ
        </Link>

        <span className="ml-auto telemetry !text-[9px] text-emerald/60">
          +{POINTS.corroboration} Eco-Points on corroboration
        </span>
      </div>
    </GlassCard>
  );
}

function MissionCard({ m, index }: { m: Mission; index: number }) {
  const [joined, setJoined] = useState(m.joined);
  const pct = (m.progress / m.total) * 100;
  return (
    <Reveal index={index}>
      <div className="glass rounded-xl p-5">
        <div className="flex items-start justify-between gap-3 mb-1.5">
          <h4 className="font-[family-name:var(--font-syne)] font-bold text-[15px]">{m.title}</h4>
          <span className="readout text-xs text-emerald whitespace-nowrap">
            +{m.reward} Eco-Points
          </span>
        </div>
        <p className="text-[12.5px] text-ink-faint font-light leading-relaxed mb-3.5">{m.desc}</p>
        {joined ? (
          <>
            <div className="flex justify-between mb-1.5">
              <span className="telemetry !text-[9px]">Progress</span>
              <span className="readout text-[11px] text-cyan">
                {m.progress}/{m.total}
              </span>
            </div>
            <div className="h-1 rounded-full bg-carbon-3 overflow-hidden">
              {/* Width encodes progress, so it renders at its value instead
                  of growing from 0 — the bar must agree with the "3/5"
                  readout above it in a screenshot, not show empty. */}
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan/70 to-emerald"
                style={{ width: `${pct}%` }}
              />
            </div>
          </>
        ) : (
          <button
            onClick={() => setJoined(true)}
            className="w-full rounded-lg border border-emerald/30 text-emerald text-[12px] font-semibold py-2 hover:bg-emerald/[0.08] transition-colors duration-300"
          >
            Join mission
          </button>
        )}
      </div>
    </Reveal>
  );
}

/* ── Success toast ────────────────────────────────────────────── */

function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => {
    const t = window.setTimeout(onClose, 4200);
    return () => window.clearTimeout(t);
  }, [onClose]);
  return (
    <motion.div
      role="status"
      aria-live="polite"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 24 }}
      transition={{ duration: 0.35, ease: EASE }}
      className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[70] glass-bright panel-glow rounded-2xl px-5 py-3.5 flex items-center gap-3 max-w-[92vw]"
    >
      <span className="grid place-items-center w-7 h-7 rounded-full bg-emerald/15 border border-emerald/40 text-emerald shrink-0">
        <svg viewBox="0 0 16 16" className="w-3.5 h-3.5" fill="none" aria-hidden>
          <path d="M3.5 8.5l3 3 6-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      <div className="min-w-0">
        <div className="text-[13px] font-medium text-ink">{message}</div>
        {/* Status ① in its own words — the old line here read "Pending
            sensor cross-check", which promised an instrument step that
            does not exist. */}
        <div className="telemetry !text-[9px] mt-0.5">
          {STATUS_META.submitted.label} · nobody has reviewed it
        </div>
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label="Dismiss"
        className="ml-1 text-ink-faint hover:text-ink transition-colors"
      >
        <svg viewBox="0 0 14 14" className="w-3 h-3" fill="none" aria-hidden>
          <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>
    </motion.div>
  );
}

/* ── Page ─────────────────────────────────────────────────────── */

export default function Community() {
  const [reports, setReports] = useState<Report[]>(SEED_REPORTS);
  const [mine, setMine] = useState<Report[]>([]);
  const [flowOpen, setFlowOpen] = useState(false);
  const [justAddedId, setJustAddedId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  // Only true once Postgres has actually answered — drives the copy that
  // claims reports persist. Never assumed.
  const [backendLive, setBackendLive] = useState(false);

  // One live-station fetch for the whole page, shared by every card's AI
  // context (the hook deduplicates at module level).
  const live = useLiveStations();

  // Merge this device's previously-submitted reports after mount (avoids any
  // SSR/localStorage hydration mismatch — the seed feed renders identically
  // on server and first client paint, then user reports fold in).
  useEffect(() => {
    const own = getUserReports();
    setMine(own);
    if (own.length) setReports([...own, ...SEED_REPORTS]);
  }, []);

  // Real submissions from Postgres, newest first, ahead of the seeded ones.
  // Local-only rows that already exist remotely are dropped so a report
  // filed on this device is not shown twice.
  useEffect(() => {
    const ac = new AbortController();
    getRemoteReports(ac.signal).then((rows) => {
      if (!rows) return; // backend unreachable — keep the local view
      setBackendLive(true);
      const remoteIds = new Set(rows.map((r) => r.id));
      const localOnly = getUserReports().filter((r) => !remoteIds.has(r.id));
      setReports([...rows, ...localOnly, ...SEED_REPORTS]);
      // Points come from the server's copy of your reports where it has
      // one, so a corroboration that happened after you filed is counted.
      setMine([...rows.filter((r) => r.userCreated), ...localOnly]);
    });
    return () => ac.abort();
  }, []);

  function handleCreated(report: Report) {
    setReports((prev) => [report, ...prev.filter((r) => r.id !== report.id)]);
    setMine((prev) => [report, ...prev.filter((r) => r.id !== report.id)]);
    setJustAddedId(report.id);
    setToast("Report filed");
    window.setTimeout(() => setJustAddedId((id) => (id === report.id ? null : id)), 4000);
  }

  return (
    <div className="max-w-7xl mx-auto px-6 pt-28 pb-20">
      {/* header */}
      <div className="flex flex-wrap items-end justify-between gap-6 mb-10">
        <div>
          <Reveal>
            <TelemetryTag tone="cyan">Ground truth network</TelemetryTag>
          </Reveal>
          <Reveal index={1}>
            <h1 className="font-[family-name:var(--font-syne)] font-bold text-4xl sm:text-5xl mt-4 tracking-tight">
              Community
            </h1>
          </Reveal>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1.6fr_1fr] gap-8 items-start">
        {/* feed */}
        <div className="flex flex-col gap-5">
          <Reveal>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="font-[family-name:var(--font-syne)] font-bold text-xl">
                  Field reports
                </h2>
                {/* The seeded entries are written examples, not submissions
                    from real people. Anything you post yourself IS real. */}
                <SampleTag
                  note={
                    backendLive
                      ? `The ${PILOT.reports} entries marked "Sample" are illustrative, written to demonstrate the feed. Anything without that mark is a real submission stored in the shared database and visible to every visitor.`
                      : `Seeded sample data — ${PILOT.reports} illustrative reports from ${PILOT.contributors} example contributors, written to demonstrate the feed. Not real submissions. Reports you file yourself are real but persist only to this browser; the shared datastore is unreachable right now.`
                  }
                >
                  {PILOT.reports} seeded examples
                </SampleTag>
              </div>
              <button
                type="button"
                onClick={() => setFlowOpen(true)}
                className="flex items-center gap-2 rounded-xl bg-emerald text-abyss text-[13px] font-semibold px-4 py-2.5 hover:shadow-[0_0_24px_rgba(45,226,166,0.4)] transition-shadow duration-300"
              >
                <svg viewBox="0 0 16 16" className="w-3.5 h-3.5" fill="none" aria-hidden>
                  <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
                New report
              </button>
            </div>
          </Reveal>

          <div className="flex flex-col gap-5">
            <AnimatePresence initial={false}>
              {reports.map((r) => (
                <motion.div
                  key={r.id}
                  layout
                  initial={{ opacity: 0, y: -16, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.45, ease: EASE }}
                >
                  <ReportCard r={r} highlight={r.id === justAddedId} live={live} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* rail */}
        <div className="flex flex-col gap-8 lg:sticky lg:top-24">
          <Reveal>
            <BadgeShowcase reports={mine} />
          </Reveal>

          <Reveal>
            <StatusLegend />
          </Reveal>

          <div>
            <Reveal>
              <div className="flex flex-wrap items-center gap-2.5 mb-4">
                <h2 className="font-[family-name:var(--font-syne)] font-bold text-xl">
                  Active missions
                </h2>
                <SampleTag note="Illustrative mission designs with example progress — no mission system is running yet, and the progress shown is not anyone's.">
                  Sample data
                </SampleTag>
              </div>
            </Reveal>
            <div className="flex flex-col gap-3.5">
              {MISSIONS.map((m, i) => (
                <MissionCard key={m.id} m={m} index={i} />
              ))}
            </div>
          </div>

          <div>
            <Reveal>
              <div className="flex flex-wrap items-center gap-2.5 mb-4">
                <h2 className="font-[family-name:var(--font-syne)] font-bold text-xl">
                  Achievements
                </h2>
                <SampleTag note="Illustrative badge set — these four are not wired to anything yet. The geographic badges and the rank ladder above them are real and are computed from your own reports.">
                  Sample data
                </SampleTag>
              </div>
            </Reveal>
            <Reveal index={1}>
              <GlassCard className="p-4 grid grid-cols-4 gap-2.5">
                {ACHIEVEMENTS.map((a) => (
                  <div
                    key={a.name}
                    title={`${a.name} — ${a.desc}`}
                    className={`group relative flex flex-col items-center gap-1.5 rounded-xl border p-3 text-center transition-all duration-300 ${
                      a.unlocked
                        ? "border-emerald/25 bg-emerald/[0.05] hover:bg-emerald/[0.1]"
                        : "border-line opacity-40 grayscale"
                    }`}
                  >
                    <span className={`text-xl ${a.unlocked ? "text-emerald" : "text-ink-faint"}`}>
                      {a.icon}
                    </span>
                    <span className="text-[10px] font-medium leading-tight">{a.name}</span>
                  </div>
                ))}
              </GlassCard>
            </Reveal>
          </div>

          <Events />
        </div>
      </div>

      <AnimatePresence>
        {flowOpen && (
          <ReportFlow onClose={() => setFlowOpen(false)} onCreated={handleCreated} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toast && <Toast message={toast} onClose={() => setToast(null)} />}
      </AnimatePresence>
    </div>
  );
}
