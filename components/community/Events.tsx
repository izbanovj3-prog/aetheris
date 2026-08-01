"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { EASE, Reveal, SourceNote, TelemetryTag } from "@/components/ui/primitives";
import { getStations } from "@/lib/data";
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

export function Events() {
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
    } catch {
      setNotice("Couldn't update your RSVP — the events datastore didn't answer.");
    } finally {
      setBusyId(null);
    }
  }

  function onCheckIn(ev: AetherisEvent) {
    if (!navigator.geolocation) {
      setNotice("This browser can't report a position, so it can't check you in.");
      return;
    }
    setBusyId(ev.id);
    setNotice(null);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          await checkIn(ev.id, pos.coords.latitude, pos.coords.longitude);
          setNotice(`Checked in at ${ev.title}.`);
          await refresh();
        } catch (err) {
          const reason = err instanceof EventError ? err.reason : "unavailable";
          setNotice(
            reason === "too-far"
              ? `You're further than ${CHECKIN_RADIUS_M} m from the event location, so the check-in wasn't recorded.`
              : reason === "too-early"
                ? "Check-in opens an hour before the event starts."
                : reason === "closed"
                  ? "Check-in closed four hours after the event started."
                  : "Couldn't record the check-in.",
          );
        } finally {
          setBusyId(null);
        }
      },
      () => {
        setNotice("Location permission is required to check in at an event.");
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
              Local eco-events
            </h2>
            {loaded && available && real.length > 0 && (
              <TelemetryTag tone="cyan">{real.length} scheduled</TelemetryTag>
            )}
          </div>
          {available && (
            <button
              type="button"
              onClick={() => setFormOpen(true)}
              className="flex items-center gap-1.5 rounded-lg border border-emerald/30 text-emerald text-[12px] font-semibold px-3 py-1.5 hover:bg-emerald/[0.08] transition-colors"
            >
              <svg viewBox="0 0 16 16" className="w-3 h-3" fill="none" aria-hidden>
                <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
              Create
            </button>
          )}
        </div>
      </Reveal>

      {notice && (
        <div
          role="status"
          className="rounded-xl border border-line bg-carbon-2/60 px-3.5 py-2.5 text-[12px] text-ink-dim mb-3"
        >
          {notice}
        </div>
      )}

      <div className="flex flex-col gap-3">
        {/* real events first */}
        {real.map((ev, i) => (
          <Reveal key={ev.id} index={i}>
            <EventCard
              ev={ev}
              busy={busyId === ev.id}
              onRsvp={() => onRsvp(ev)}
              onCheckIn={() => onCheckIn(ev)}
            />
          </Reveal>
        ))}

        {loaded && available && real.length === 0 && (
          <div className="glass rounded-xl p-4">
            <p className="text-[12.5px] text-ink-dim font-light leading-relaxed">
              No events have been created yet. Anyone can add one — a cleanup, a
              survey, a mapping walk — and people can RSVP and check in when they
              arrive.
            </p>
          </div>
        )}

        {loaded && !available && (
          <div className="glass rounded-xl p-4">
            <p className="text-[12.5px] text-ink-dim font-light leading-relaxed">
              The events datastore isn&apos;t reachable from here, so no real events
              can be listed or created right now. The examples below are the
              illustrative ones that have always been on this page.
            </p>
          </div>
        )}

        {/* sample events, clearly separated and marked */}
        <div className="flex items-center gap-2.5 pt-1">
          <span className="h-px flex-1 bg-line" />
          <span className="inline-flex items-center gap-1.5">
            <TelemetryTag tone="amber">Sample data</TelemetryTag>
            <SourceNote source="Illustrative examples with invented attendee counts, kept from the original static block to show what the section is for. They are not scheduled gatherings, there is no sign-up behind them, and no one is attending them." />
          </span>
          <span className="h-px flex-1 bg-line" />
        </div>

        {SAMPLE_EVENTS.map((e, i) => {
          const d = eventDay(e.startsAt);
          return (
            <Reveal key={e.id} index={i}>
              <div className="glass rounded-xl p-4 flex items-center gap-4 opacity-70">
                <DateBlock month={d.month} day={d.day} />
                <div className="flex-1 min-w-0">
                  <div className="text-[13.5px] font-medium leading-snug flex items-center gap-2">
                    {e.title}
                    <span
                      title="Illustrative example — not a scheduled gathering."
                      className="telemetry !text-[8px] text-amber border border-amber/30 rounded-full px-1.5 py-0.5 cursor-help shrink-0"
                    >
                      Sample
                    </span>
                  </div>
                  <div className="telemetry !text-[9px] mt-1">
                    {e.place} · {e.attendees} attending (illustrative)
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
  busy,
  onRsvp,
  onCheckIn,
}: {
  ev: AetherisEvent;
  busy: boolean;
  onRsvp: () => void;
  onCheckIn: () => void;
}) {
  const d = eventDay(ev.startsAt);
  const window = checkinWindow(ev.startsAt);
  const full = ev.capacity != null && ev.going >= ev.capacity && !ev.iRsvpd;

  return (
    <div className="glass rounded-xl p-4 flex flex-col gap-3 hover:border-line-bright transition-colors duration-300">
      <div className="flex items-start gap-4">
        <DateBlock month={d.month} day={d.day} />
        <div className="flex-1 min-w-0">
          <div className="text-[13.5px] font-medium leading-snug flex items-center gap-2 flex-wrap">
            {ev.title}
            {ev.mine && (
              <span className="telemetry !text-[8px] text-emerald border border-emerald/30 rounded-full px-1.5 py-0.5">
                Yours
              </span>
            )}
          </div>
          <div className="telemetry !text-[9px] mt-1">
            {ev.place} · {eventClock(ev.startsAt)} ·{" "}
            {ev.capacity != null ? `${ev.going}/${ev.capacity} going` : `${ev.going} going`}
            {ev.checkedIn > 0 && ` · ${ev.checkedIn} checked in`}
          </div>
        </div>
      </div>

      <p className="text-[12.5px] text-ink-dim font-light leading-relaxed">
        {ev.description}
      </p>

      <div className="flex items-center gap-2 flex-wrap">
        <button
          type="button"
          onClick={onRsvp}
          disabled={busy || full}
          className={`rounded-lg border px-3.5 py-1.5 text-[12px] font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
            ev.iRsvpd
              ? "border-emerald/40 text-emerald bg-emerald/[0.07]"
              : "border-line text-ink-dim hover:text-ink hover:border-line-bright"
          }`}
        >
          {ev.iRsvpd ? "Going ✓" : full ? "Full" : "RSVP"}
        </button>

        {ev.iCheckedIn ? (
          <span className="telemetry !text-[9px] text-emerald">Checked in ✓</span>
        ) : (
          <button
            type="button"
            onClick={onCheckIn}
            disabled={busy || window !== "open"}
            title={
              window === "early"
                ? "Check-in opens an hour before the start."
                : window === "closed"
                  ? "Check-in closed four hours after the start."
                  : `Uses your location — you must be within ${CHECKIN_RADIUS_M} m of the event.`
            }
            className="rounded-lg border border-line text-ink-dim hover:text-ink hover:border-line-bright px-3.5 py-1.5 text-[12px] font-semibold transition-colors disabled:opacity-35 disabled:cursor-not-allowed"
          >
            {window === "open" ? "Check in" : window === "early" ? "Check-in not open" : "Check-in closed"}
          </button>
        )}
      </div>
    </div>
  );
}

function DateBlock({ month, day }: { month: string; day: string }) {
  return (
    <div className="grid place-items-center w-12 h-12 rounded-lg bg-carbon-3 border border-line-bright shrink-0">
      <span className="telemetry !text-[8px] !tracking-[0.1em] text-cyan text-center leading-tight">
        {month}
        <br />
        <span className="text-ink text-[13px] font-semibold tracking-normal">{day}</span>
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
        reason === "rate-limited"
          ? "You've created three events in the last day — that's the limit for now."
          : reason === "in-past"
            ? "That start time is in the past."
            : "Couldn't create the event — the datastore didn't accept it.",
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
        aria-label="Close event form"
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
            <div className="telemetry mb-1.5">Organise something</div>
            <h2 id="event-form-title" className="font-[family-name:var(--font-syne)] font-bold text-xl leading-none">
              New event
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid place-items-center w-8 h-8 rounded-lg border border-line text-ink-dim hover:text-ink hover:border-line-bright transition-colors shrink-0"
          >
            <svg viewBox="0 0 14 14" className="w-3 h-3" fill="none" aria-hidden>
              <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="px-5 sm:px-6 py-5 flex flex-col gap-4">
          <Labelled label="Title" htmlFor="ev-title">
            <input
              id="ev-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={120}
              placeholder="e.g. Ile-Alatau foothills cleanup"
              className="w-full bg-carbon-2/60 border border-line rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-emerald/40 placeholder:text-ink-faint transition-colors"
            />
          </Labelled>

          <Labelled label="What is it" htmlFor="ev-desc">
            <textarea
              id="ev-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              maxLength={1200}
              placeholder="What are you doing, what should people bring, where exactly do you meet?"
              className="w-full bg-carbon-2/60 border border-line rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-emerald/40 placeholder:text-ink-faint transition-colors resize-none leading-relaxed"
            />
          </Labelled>

          <div className="grid sm:grid-cols-2 gap-4">
            <Labelled label="Starts" htmlFor="ev-when">
              <input
                id="ev-when"
                type="datetime-local"
                value={when}
                onChange={(e) => setWhen(e.target.value)}
                className="w-full bg-carbon-2/60 border border-line rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-emerald/40 transition-colors"
              />
            </Labelled>
            <Labelled label="Participant cap (optional)" htmlFor="ev-cap">
              <input
                id="ev-cap"
                type="number"
                min={2}
                max={2000}
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                placeholder="No limit"
                className="w-full bg-carbon-2/60 border border-line rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-emerald/40 placeholder:text-ink-faint transition-colors"
              />
            </Labelled>
          </div>

          <Labelled label="Area" htmlFor="ev-place">
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
                    {s.name}
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
            label={`Drag the pin to the meeting point. Check-in only works within ${CHECKIN_RADIUS_M} m of it.`}
          />

          {error && (
            <div role="alert" className="rounded-xl border border-coral/40 bg-coral/[0.08] px-4 py-3 text-[13px] text-coral">
              {error}
            </div>
          )}
        </div>

        <div className="sticky bottom-0 flex items-center gap-2 px-5 sm:px-6 py-4 border-t border-line bg-carbon-2/80 backdrop-blur-md">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-line text-ink-dim hover:text-ink hover:border-line-bright px-4 py-2.5 text-[13px] font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={!valid || busy}
            className="ml-auto inline-flex items-center gap-2 rounded-xl bg-emerald text-abyss px-5 py-2.5 text-[13px] font-semibold hover:shadow-[0_0_24px_rgba(45,226,166,0.4)] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {busy ? "Creating…" : "Create event"}
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
