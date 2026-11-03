"use client";

import { useCommunityText, useLocale } from "@/lib/useLocale";
import { placeName } from "@/lib/communityText";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { EASE, Reveal, SourceNote, TelemetryTag } from "@/components/ui/primitives";
import { getStations } from "@/lib/data";
import { isConfigured } from "@/lib/supabase";
import {
  CHECKIN_RADIUS_M,
  EventError,
  SAMPLE_EVENTS,
  checkIn,
  checkinWindow,
  createEvent,
  eventClock,
  eventDay,
  listEvents,
  setRsvp,
  type AetherisEvent,
} from "@/lib/events";
import { PinMap } from "./PinMap";

/* ─────────────────────────────────────────────────────────────
   Local eco-events — concept section 4.1.

   What used to be three hardcoded rows is now a real module: anyone can
   create an event, RSVP to one, and check in when they get there. The
   three examples stay, still labelled as samples under the same
   convention the rest of /community uses, and they sit below real events
   once real ones exist.

   If supabase/community-2.sql has not been run there are no tables to
   write to. The module says that plainly instead of showing a create
   button that silently fails.
   ───────────────────────────────────────────────────────────── */

const FALLBACK: [number, number] = [43.238, 76.889]; // Almaty

/** Month abbreviation in the reader's language (UTC, like eventDay). */
const monthIn = (ts: number, months: string[]) => months[new Date(ts).getUTCMonth()];

export function Events() {
  const t = useCommunityText();
  const e9 = t.events;
  const locale = useLocale();
  const ids = useMemo(() => new Map(getStations().map((s) => [s.name, s.id])), []);
  const [events, setEvents] = useState<AetherisEvent[] | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const refresh = useCallback(async (signal?: AbortSignal) => {
    const rows = await listEvents(signal);
    setEvents(rows);
    setLoaded(true);
  }, []);

  useEffect(() => {
    const ac = new AbortController();
    refresh(ac.signal);
    return () => ac.abort();
  }, [refresh]);

  /** Null means the tables are unreachable — distinct from "none yet". */
  const available = events !== null;
  const real = events ?? [];

  async function onRsvp(ev: AetherisEvent) {
    setBusyId(ev.id);
    setNotice(null);
    try {
      await setRsvp(ev.id, !ev.iRsvpd);
      // Optimistic locally, then reconciled against the server on refresh —
      // the count has to come from the table, not from an increment here.
      setEvents((prev) =>
        (prev ?? []).map((e) =>
          e.id === ev.id
            ? { ...e, iRsvpd: !ev.iRsvpd, going: e.going + (ev.iRsvpd ? -1 : 1) }
            : e,
        ),
      );
      await refresh();
    } catch (err) {
      setNotice(err instanceof EventError && err.reason === "full" ? e9.errFull : e9.errRsvp);
    } finally {
      setBusyId(null);
    }
  }

  function onCheckIn(ev: AetherisEvent) {
    if (!navigator.geolocation) {
      setNotice(e9.errNoGeo);
      return;
    }
    setBusyId(ev.id);
    setNotice(null);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          await checkIn(ev.id, pos.coords.latitude, pos.coords.longitude);
          setNotice(e9.okCheckedIn(ev.title));
          await refresh();
        } catch (err) {
          const reason = err instanceof EventError ? err.reason : "unavailable";
          setNotice(
            reason === "too-far"
              ? e9.errTooFar(CHECKIN_RADIUS_M)
              : reason === "too-early"
                ? e9.errTooEarly
                : reason === "closed"
                  ? e9.errClosed
                  : e9.errCheckin,
          );
        } finally {
          setBusyId(null);
        }
      },
      () => {
        setNotice(e9.errPermission);
        setBusyId(null);
      },
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  }

  return (
    <div>
      <Reveal>
        <div className="flex flex-wrap items-center justify-between gap-2.5 mb-4">
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 className="font-[family-name:var(--font-syne)] font-bold text-xl">
              {e9.title}
            </h2>
            {loaded && available && real.length > 0 && (
              <TelemetryTag tone="cyan">{e9.scheduled(real.length)}</TelemetryTag>
            )}
          </div>
          {available && (
            <button
              type="button"
              onClick={() => setFormOpen(true)}
              className="flex items-center gap-1.5 rounded-lg border border-emerald/30 text-emerald text-[0.9375rem] font-semibold px-3 py-1.5 hover:bg-emerald/[0.08] transition-colors"
            >
              <svg viewBox="0 0 16 16" className="w-3 h-3" fill="none" aria-hidden>
                <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
              {e9.create}
            </button>
          )}
        </div>
      </Reveal>

      {notice && (
        <div
          role="status"
          className="rounded-xl border border-line bg-carbon-2/60 px-3.5 py-2.5 text-[0.9375rem] text-ink-dim mb-3"
        >
          {notice}
        </div>
      )}

      <div className="flex flex-col gap-3">
        {/* real events first */}
        {real.map((ev, i) => (
          <Reveal key={ev.id} index={i}>
            <EventCard
              placeLabel={placeName(ev.place, locale, ids)}
              ev={ev}
              busy={busyId === ev.id}
              onRsvp={() => onRsvp(ev)}
              onCheckIn={() => onCheckIn(ev)}
            />
          </Reveal>
        ))}

        {loaded && available && real.length === 0 && (
          <div className="glass rounded-xl p-4">
            <p className="text-base text-ink-dim font-light leading-relaxed">
              {e9.none}
            </p>
          </div>
        )}

        {loaded && !available && (
          <div className="glass rounded-xl p-4">
            <p className="text-base text-ink-dim font-light leading-relaxed">
              {isConfigured() ? e9.unreachable : e9.noBackend}
            </p>
          </div>
        )}

        {/* sample events, clearly separated and marked */}
        <div className="flex items-center gap-2.5 pt-1">
          <span className="h-px flex-1 bg-line" />
          <span className="inline-flex items-center gap-1.5">
            <TelemetryTag tone="amber">{t.page.sampleData}</TelemetryTag>
            <SourceNote source={e9.sampleNote} />
          </span>
          <span className="h-px flex-1 bg-line" />
        </div>

        {SAMPLE_EVENTS.map((e, i) => {
          const d = eventDay(e.startsAt);
          return (
            <Reveal key={e.id} index={i}>
              <div className="glass rounded-xl p-4 flex items-center gap-4">
                <DateBlock month={monthIn(e.startsAt, e9.months)} day={d.day} />
                <div className="flex-1 min-w-0">
                  <div className="text-[0.9375rem] font-medium leading-snug flex flex-wrap items-center gap-2">
                    {e9.samples[e.id]?.title ?? e.title}
                    <span
                      title={e9.sampleTitle}
                      className="telemetry !text-[0.9375rem] text-amber border border-amber/30 rounded-full px-1.5 py-0.5 cursor-help shrink-0"
                    >
                      {t.card.sample}
                    </span>
                  </div>
                  <div className="telemetry !text-[0.9375rem] mt-1">
                    {e9.samples[e.id]?.place ?? e.place} · {e9.attendingSample(e.attendees)}
                  </div>
                </div>
              </div>
            </Reveal>
          );
        })}
      </div>

      <AnimatePresence>
        {formOpen && (
          <EventForm
            onClose={() => setFormOpen(false)}
            onCreated={async () => {
              setFormOpen(false);
              await refresh();
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── one real event ───────────────────────────────────────────── */

function EventCard({
  ev,
  placeLabel,
  busy,
  onRsvp,
  onCheckIn,
}: {
  placeLabel: string;
  ev: AetherisEvent;
  busy: boolean;
  onRsvp: () => void;
  onCheckIn: () => void;
}) {
  const t = useCommunityText();
  const e9 = t.events;
  const d = eventDay(ev.startsAt);
  const window = checkinWindow(ev.startsAt);
  const full = ev.capacity != null && ev.going >= ev.capacity && !ev.iRsvpd;

  return (
    <div className="glass rounded-xl p-4 flex flex-col gap-3 hover:border-line-bright transition-colors duration-300">
      <div className="flex items-start gap-4">
        <DateBlock month={monthIn(ev.startsAt, e9.months)} day={d.day} />
        <div className="flex-1 min-w-0">
          <div className="text-[0.9375rem] font-medium leading-snug flex items-center gap-2 flex-wrap">
            {ev.title}
            {ev.mine && (
              <span className="telemetry !text-[0.9375rem] text-emerald border border-emerald/30 rounded-full px-1.5 py-0.5">
                {e9.yours}
              </span>
            )}
          </div>
          <div className="telemetry !text-[0.9375rem] mt-1">
            {placeLabel} · {eventClock(ev.startsAt)} ·{" "}
            {ev.capacity != null ? e9.goingCapped(ev.going, ev.capacity) : e9.going(ev.going)}
            {ev.checkedIn > 0 && e9.checkedInCount(ev.checkedIn)}
          </div>
        </div>
      </div>

      <p className="text-base text-ink-dim font-light leading-relaxed">
        {ev.description}
      </p>

      <div className="flex items-center gap-2 flex-wrap">
        <button
          type="button"
          onClick={onRsvp}
          disabled={busy || full}
          className={`rounded-lg border px-3.5 py-1.5 text-[0.9375rem] font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
            ev.iRsvpd
              ? "border-emerald/40 text-emerald bg-emerald/[0.07]"
              : "border-line text-ink-dim hover:text-ink hover:border-line-bright"
          }`}
        >
          {ev.iRsvpd ? e9.rsvpGoing : full ? e9.full : e9.rsvp}
        </button>

        {ev.iCheckedIn ? (
          <span className="telemetry !text-[0.9375rem] text-emerald">{e9.checkedIn}</span>
        ) : (
          <button
            type="button"
            onClick={onCheckIn}
            disabled={busy || window !== "open"}
            title={
              window === "early"
                ? e9.hintEarly
                : window === "closed"
                  ? e9.hintClosed
                  : e9.hintOpen(CHECKIN_RADIUS_M)
            }
            className="rounded-lg border border-line text-ink-dim hover:text-ink hover:border-line-bright px-3.5 py-1.5 text-[0.9375rem] font-semibold transition-colors disabled:opacity-35 disabled:cursor-not-allowed"
          >
            {window === "open" ? e9.checkIn : window === "early" ? e9.notOpen : e9.closed}
          </button>
        )}
      </div>
    </div>
  );
}

function DateBlock({ month, day }: { month: string; day: string }) {
  return (
    <div className="grid place-items-center w-12 h-12 rounded-lg bg-carbon-3 border border-line-bright shrink-0">
      <span className="telemetry !text-[0.9375rem] !tracking-[0.1em] text-cyan text-center leading-tight">
        {month}
        <br />
        <span className="text-ink text-[0.9375rem] font-semibold tracking-normal">{day}</span>
      </span>
    </div>
  );
}

/* ── create ───────────────────────────────────────────────────── */

function EventForm({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const stations = useMemo(() => getStations(), []);
  const t = useCommunityText();
  const e9 = t.events;
  const locale = useLocale();
  const ids = useMemo(() => new Map(stations.map((s) => [s.name, s.id])), [stations]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [place, setPlace] = useState(stations[0]?.name ?? "Almaty");
  const [lat, setLat] = useState(stations[0]?.lat ?? FALLBACK[0]);
  const [lon, setLon] = useState(stations[0]?.lon ?? FALLBACK[1]);
  const [when, setWhen] = useState("");
  const [capacity, setCapacity] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const valid =
    title.trim().length >= 4 && description.trim().length >= 4 && when !== "";

  async function submit() {
    if (!valid || busy) return;
    setBusy(true);
    setError(null);
    try {
      const cap = capacity.trim() ? Number(capacity) : null;
      await createEvent({
        title,
        description,
        place,
        lat,
        lon,
        // A datetime-local value is wall-clock with no zone; the browser's
        // own offset is the right reading of "19:00" typed by someone
        // standing where the event is.
        startsAt: new Date(when).getTime(),
        capacity: cap != null && Number.isFinite(cap) ? cap : null,
      });
      onCreated();
    } catch (err) {
      const reason = err instanceof EventError ? err.reason : "unavailable";
      setError(
        reason === "rate-limited" ? e9.errRate : reason === "in-past" ? e9.errPast : e9.errCreate,
      );
      setBusy(false);
    }
  }

  return (
    <motion.div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
    >
      <button
        type="button"
        aria-label={e9.formClose}
        onClick={onClose}
        className="absolute inset-0 bg-abyss/85 backdrop-blur-sm cursor-default"
        tabIndex={-1}
      />
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="event-form-title"
        initial={{ opacity: 0, y: 40, scale: 0.99 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 30, scale: 0.99 }}
        transition={{ duration: 0.4, ease: EASE }}
        onKeyDown={(e) => e.key === "Escape" && onClose()}
        className="relative w-full sm:max-w-lg max-h-[92svh] overflow-y-auto glass-bright panel-glow rounded-t-3xl sm:rounded-2xl ticks"
      >
        <div className="sticky top-0 z-10 flex items-start justify-between gap-3 px-5 sm:px-6 py-4 border-b border-line bg-carbon-2/80 backdrop-blur-md rounded-t-3xl sm:rounded-t-2xl">
          <div>
            <div className="telemetry mb-1.5">{e9.formKicker}</div>
            <h2 id="event-form-title" className="font-[family-name:var(--font-syne)] font-bold text-xl leading-none">
              {e9.formTitle}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t.flow.close}
            className="grid place-items-center w-8 h-8 rounded-lg border border-line text-ink-dim hover:text-ink hover:border-line-bright transition-colors shrink-0"
          >
            <svg viewBox="0 0 14 14" className="w-3 h-3" fill="none" aria-hidden>
              <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="px-5 sm:px-6 py-5 flex flex-col gap-4">
          <Labelled label={e9.fTitle} htmlFor="ev-title">
            <input
              id="ev-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={120}
              placeholder={e9.fTitlePh}
              className="w-full bg-carbon-2/60 border border-line rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-emerald/40 placeholder:text-ink-faint transition-colors"
            />
          </Labelled>

          <Labelled label={e9.fDesc} htmlFor="ev-desc">
            <textarea
              id="ev-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              maxLength={1200}
              placeholder={e9.fDescPh}
              className="w-full bg-carbon-2/60 border border-line rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-emerald/40 placeholder:text-ink-faint transition-colors resize-none leading-relaxed"
            />
          </Labelled>

          <div className="grid sm:grid-cols-2 gap-4">
            <Labelled label={e9.fStarts} htmlFor="ev-when">
              <input
                id="ev-when"
                type="datetime-local"
                value={when}
                onChange={(e) => setWhen(e.target.value)}
                className="w-full bg-carbon-2/60 border border-line rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-emerald/40 transition-colors"
              />
            </Labelled>
            <Labelled label={e9.fCap} htmlFor="ev-cap">
              <input
                id="ev-cap"
                type="number"
                min={2}
                max={2000}
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                placeholder={e9.fCapPh}
                className="w-full bg-carbon-2/60 border border-line rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-emerald/40 placeholder:text-ink-faint transition-colors"
              />
            </Labelled>
          </div>

          <Labelled label={e9.fArea} htmlFor="ev-place">
            <div className="relative">
              <select
                id="ev-place"
                value={place}
                onChange={(e) => {
                  const s = stations.find((st) => st.name === e.target.value);
                  setPlace(e.target.value);
                  if (s) {
                    setLat(s.lat);
                    setLon(s.lon);
                  }
                }}
                className="w-full appearance-none bg-carbon-2/60 border border-line rounded-xl pl-3.5 pr-9 py-2.5 text-sm outline-none focus:border-emerald/40 transition-colors cursor-pointer"
              >
                {stations.map((s) => (
                  <option key={s.id} value={s.name}>
                    {placeName(s.name, locale, ids)}
                  </option>
                ))}
              </select>
              <svg viewBox="0 0 16 16" className="w-3.5 h-3.5 text-ink-faint absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" aria-hidden>
                <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </Labelled>

          <PinMap
            lat={lat}
            lon={lon}
            onChange={(la, lo) => {
              setLat(la);
              setLon(lo);
            }}
            height={200}
            label={e9.fPin(CHECKIN_RADIUS_M)}
          />

          {error && (
            <div role="alert" className="rounded-xl border border-coral/40 bg-coral/[0.08] px-4 py-3 text-[0.9375rem] text-coral">
              {error}
            </div>
          )}
        </div>

        <div className="sticky bottom-0 flex items-center gap-2 px-5 sm:px-6 py-4 border-t border-line bg-carbon-2/80 backdrop-blur-md">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-line text-ink-dim hover:text-ink hover:border-line-bright px-4 py-2.5 text-[0.9375rem] font-medium transition-colors"
          >
            {e9.cancel}
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={!valid || busy}
            className="ml-auto inline-flex items-center gap-2 rounded-xl bg-emerald text-abyss px-5 py-2.5 text-[0.9375rem] font-semibold hover:shadow-[0_0_24px_rgba(45,226,166,0.4)] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {busy ? e9.creating : e9.createEvent}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function Labelled({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="telemetry mb-2 block">
        {label}
      </label>
      {children}
    </div>
  );
}
