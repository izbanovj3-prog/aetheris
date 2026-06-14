"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  EASE,
  GlassCard,
  Reveal,
  TelemetryTag,
} from "@/components/ui/primitives";
import {
  CATEGORIES,
  SEED_REPORTS,
  SEVERITIES,
  STATUS_META,
  displayTime,
  getUserReports,
  type Report,
  type Tone,
} from "@/lib/reports";
import { NewReportModal } from "./NewReportModal";

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

/* ── Missions / achievements / events (static) ──────────────── */

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

const ACHIEVEMENTS = [
  { icon: "◬", name: "First Signal", desc: "First verified report", unlocked: true },
  { icon: "❋", name: "Field Naturalist", desc: "25 species logged", unlocked: true },
  { icon: "◈", name: "Stream Keeper", desc: "10 water samples", unlocked: true },
  { icon: "⬡", name: "Sentinel", desc: "100 verified reports", unlocked: false },
  { icon: "✦", name: "Constellation", desc: "Reports on 3 continents", unlocked: false },
  { icon: "◉", name: "Ground Truth", desc: "Sensor-confirmed ×50", unlocked: false },
];

const EVENTS = [
  { date: "JUN 14", title: "Ile-Alatau foothills cleanup", place: "Almaty", attendees: 86 },
  { date: "JUN 20", title: "Urban heat-island mapping walk", place: "Astana", attendees: 41 },
  { date: "JUN 27", title: "Lake Balkhash shoreline survey", place: "Balkhash", attendees: 23 },
];

/* ── Report card ──────────────────────────────────────────────── */

function ReportCard({ r, highlight }: { r: Report; highlight?: boolean }) {
  const [votes, setVotes] = useState(r.upvotes);
  const [voted, setVoted] = useState(false);
  const cat = CATEGORIES[r.category];
  const sev = SEVERITIES[r.severity];
  const status = STATUS_META[r.status];

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
            <div className="text-sm font-medium flex items-center gap-2">
              {r.author}
              {r.userCreated && (
                <span className="telemetry !text-[8px] text-emerald border border-emerald/30 rounded-full px-1.5 py-0.5">
                  You
                </span>
              )}
            </div>
            <div className="telemetry !text-[9px] mt-0.5">
              {r.city} · {displayTime(r)}
            </div>
          </div>
        </div>
        <span className={`telemetry !text-[9px] !tracking-[0.14em] border rounded-full px-2.5 py-1 whitespace-nowrap ${TONE_CHIP[status.tone]}`}>
          {status.label}
        </span>
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

      {r.photo && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={r.photo}
          alt={`Field photo for ${r.title}`}
          className="w-full max-h-64 object-cover rounded-xl border border-line mb-4"
        />
      )}

      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => {
            setVoted((v) => !v);
            setVotes((v) => (voted ? v - 1 : v + 1));
          }}
          aria-pressed={voted}
          aria-label={voted ? "Remove upvote" : "Upvote report"}
          className={`flex items-center gap-2 text-[13px] rounded-full border px-3.5 py-1.5 transition-all duration-300 ${
            voted
              ? "border-emerald/40 text-emerald bg-emerald/[0.07]"
              : "border-line text-ink-dim hover:border-line-bright hover:text-ink"
          }`}
        >
          <svg viewBox="0 0 16 16" className="w-3.5 h-3.5" fill="none" aria-hidden>
            <path d="M8 13V3M4 7l4-4 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="readout">{votes}</span>
        </button>
        <span className="flex items-center gap-2 text-[13px] text-ink-faint">
          <svg viewBox="0 0 16 16" className="w-3.5 h-3.5" fill="none" aria-hidden>
            <path d="M14 8a6 6 0 0 1-6 6H2l1.5-2.6A6 6 0 1 1 14 8Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
          </svg>
          {r.comments}
        </span>
        <span className="ml-auto telemetry !text-[9px] text-emerald/60">+25 pts on verification</span>
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
          <span className="readout text-xs text-emerald whitespace-nowrap">+{m.reward} pts</span>
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
              <motion.div
                initial={{ width: 0 }}
                whileInView={{ width: `${pct}%` }}
                viewport={{ once: true }}
                transition={{ duration: 1, ease: EASE }}
                className="h-full rounded-full bg-gradient-to-r from-cyan/70 to-emerald"
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
        <div className="telemetry !text-[9px] mt-0.5">Pending sensor cross-check · +25 pts on verification</div>
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
  const [modalOpen, setModalOpen] = useState(false);
  const [justAddedId, setJustAddedId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Merge this device's previously-submitted reports after mount (avoids any
  // SSR/localStorage hydration mismatch — the seed feed renders identically
  // on server and first client paint, then user reports fold in).
  useEffect(() => {
    const mine = getUserReports();
    if (mine.length) setReports([...mine, ...SEED_REPORTS]);
  }, []);

  function handleCreated(report: Report) {
    setReports((prev) => [report, ...prev.filter((r) => r.id !== report.id)]);
    setJustAddedId(report.id);
    setModalOpen(false);
    setToast("Report submitted to the network");
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
        <Reveal index={2}>
          <GlassCard bright className="px-6 py-4 flex items-center gap-6">
            <div>
              <div className="telemetry mb-1">Your points</div>
              <div className="readout text-2xl text-emerald">2,840</div>
            </div>
            <div className="w-px h-10 bg-line-bright" />
            <div>
              <div className="telemetry mb-1">Rank</div>
              <div className="font-[family-name:var(--font-syne)] font-bold text-lg">
                Sentinel II
              </div>
            </div>
            <div className="w-px h-10 bg-line-bright hidden sm:block" />
            <div className="hidden sm:block">
              <div className="telemetry mb-1">Verified reports</div>
              <div className="readout text-2xl text-cyan">38</div>
            </div>
          </GlassCard>
        </Reveal>
      </div>

      <div className="grid lg:grid-cols-[1.6fr_1fr] gap-8 items-start">
        {/* feed */}
        <div className="flex flex-col gap-5">
          <Reveal>
            <div className="flex items-center justify-between">
              <h2 className="font-[family-name:var(--font-syne)] font-bold text-xl">
                Field reports
              </h2>
              <button
                type="button"
                onClick={() => setModalOpen(true)}
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
                  <ReportCard r={r} highlight={r.id === justAddedId} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* rail */}
        <div className="flex flex-col gap-8 lg:sticky lg:top-24">
          <div>
            <Reveal>
              <h2 className="font-[family-name:var(--font-syne)] font-bold text-xl mb-4">
                Active missions
              </h2>
            </Reveal>
            <div className="flex flex-col gap-3.5">
              {MISSIONS.map((m, i) => (
                <MissionCard key={m.id} m={m} index={i} />
              ))}
            </div>
          </div>

          <div>
            <Reveal>
              <h2 className="font-[family-name:var(--font-syne)] font-bold text-xl mb-4">
                Achievements
              </h2>
            </Reveal>
            <Reveal index={1}>
              <GlassCard className="p-4 grid grid-cols-3 gap-2.5">
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

          <div>
            <Reveal>
              <h2 className="font-[family-name:var(--font-syne)] font-bold text-xl mb-4">
                Local eco-events
              </h2>
            </Reveal>
            <div className="flex flex-col gap-3">
              {EVENTS.map((e, i) => (
                <Reveal key={e.title} index={i}>
                  <div className="glass rounded-xl p-4 flex items-center gap-4 hover:border-line-bright transition-colors duration-300">
                    <div className="grid place-items-center w-12 h-12 rounded-lg bg-carbon-3 border border-line-bright shrink-0">
                      <span className="telemetry !text-[8px] !tracking-[0.1em] text-cyan text-center leading-tight">
                        {e.date.split(" ")[0]}
                        <br />
                        <span className="text-ink text-[13px] font-semibold tracking-normal">
                          {e.date.split(" ")[1]}
                        </span>
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13.5px] font-medium leading-snug">{e.title}</div>
                      <div className="telemetry !text-[9px] mt-1">
                        {e.place} · {e.attendees} attending
                      </div>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {modalOpen && (
          <NewReportModal onClose={() => setModalOpen(false)} onCreated={handleCreated} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toast && <Toast message={toast} onClose={() => setToast(null)} />}
      </AnimatePresence>
    </div>
  );
}
