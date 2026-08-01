"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { EASE } from "@/components/ui/primitives";
import { getStations } from "@/lib/data";
import { nearestStation } from "@/lib/aiContext";
import { POINTS } from "@/lib/points";
import {
  CATEGORIES,
  PHOTO_MIN_EDGE,
  RateLimitError,
  SEVERITIES,
  STATUS_META,
  createReport,
  getUserReports,
  processPhoto,
  type Report,
  type ReportCategory,
  type Severity,
  type Tone,
} from "@/lib/reports";
import { PinMap } from "./PinMap";

/* ─────────────────────────────────────────────────────────────
   Report submission — the five-step flow from concept section 1.1.

   Each step is its own full screen rather than one long form. On a phone,
   standing at the thing you are reporting, a scrolling form with six
   fields is what makes people give up halfway; one decision per screen is
   what makes them finish.

     1 · Photo        — the camera opens straight away, with a rule-of-
                        thirds guide so repeat photos of one location
                        frame comparably.
     2 · Location     — GPS pin, draggable, because a photo taken from a
                        window or a hillside fixes somewhere the problem
                        is not.
     3 · Category     — the five glyphs already used across the site.
     4 · Severity     — the existing Low/Moderate/High selector, plus an
                        optional note capped at 280 characters.
     5 · Confirmation — what was actually done with it, in the words of
                        status ①. Never "your report has been checked".

   The confirmation copy is the part with a rule attached: no screen in
   this flow may say or imply that a report has been verified, confirmed,
   validated or resolved. Nothing about filing a report makes it true, and
   the platform has no moderator, no instrument check and no legal
   standing behind it. See lib/reports.ts.
   ───────────────────────────────────────────────────────────── */

const TONE_TEXT: Record<Tone, string> = {
  emerald: "text-emerald",
  cyan: "text-cyan",
  amber: "text-amber",
  coral: "text-coral",
  atmos: "text-atmos",
};

const TONE_ACTIVE: Record<Tone, string> = {
  emerald: "border-emerald/50 bg-emerald/10 text-emerald",
  cyan: "border-cyan/50 bg-cyan/10 text-cyan",
  amber: "border-amber/50 bg-amber/10 text-amber",
  coral: "border-coral/50 bg-coral/10 text-coral",
  atmos: "border-atmos/50 bg-atmos/10 text-atmos",
};

const CATEGORY_KEYS = Object.keys(CATEGORIES) as ReportCategory[];
const SEVERITY_KEYS = Object.keys(SEVERITIES) as Severity[];

/** Fallback map centre when geolocation is refused or unavailable. */
const FALLBACK: [number, number] = [43.238, 76.889]; // Almaty

const NOTE_MAX = 280;

const STEP_TITLES = [
  "Photo",
  "Location",
  "Category",
  "Severity & note",
  "Submitted",
];

type GeoState = "idle" | "locating" | "ok" | "denied" | "unsupported";

export function ReportFlow({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (r: Report) => void;
}) {
  const [step, setStep] = useState(0);

  /* step 1 */
  const [photo, setPhoto] = useState<string | null>(null);
  const [photoName, setPhotoName] = useState<string | null>(null);
  const [photoQuality, setPhotoQuality] = useState(false);
  const [photoNote, setPhotoNote] = useState<string | null>(null);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);

  /* step 2 */
  const [lat, setLat] = useState(FALLBACK[0]);
  const [lon, setLon] = useState(FALLBACK[1]);
  const [geo, setGeo] = useState<GeoState>("idle");
  const [cityOverride, setCityOverride] = useState<string | null>(null);

  /* step 3 + 4 */
  const [category, setCategory] = useState<ReportCategory | null>(null);
  const [severity, setSeverity] = useState<Severity>("moderate");
  const [note, setNote] = useState("");
  const [parentId, setParentId] = useState<string>("");

  /* submission */
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [created, setCreated] = useState<Report | null>(null);

  const fileRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);

  const stations = useMemo(() => getStations(), []);
  const cities = useMemo(
    () => [...new Set(stations.map((s) => s.name))].sort((a, b) => a.localeCompare(b)),
    [stations],
  );

  /** Reports this device filed, offered as the target of a follow-up. */
  const ownReports = useMemo(
    () => (typeof window === "undefined" ? [] : getUserReports().slice(0, 12)),
    [],
  );

  /* The city label the report is filed under. Derived from the pin, so it
     tracks the map rather than a separate control the user has to keep in
     sync; the select below only overrides it. The label has to be one of
     the station names, because that is the key the per-city community
     aggregate joins on. */
  const derivedCity = useMemo(() => {
    const near = nearestStation({ city: "", lat, lon }, stations);
    return near?.station.name ?? null;
  }, [lat, lon, stations]);
  const city = cityOverride ?? derivedCity;

  /* focus management + scroll lock + Escape */
  useEffect(() => {
    restoreFocusRef.current = document.activeElement as HTMLElement | null;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
      restoreFocusRef.current?.focus?.();
    };
  }, []);

  /* Ask for a position as soon as the location step is reached — not on
     mount, so the permission prompt arrives when the map that needs it is
     on screen and the request makes sense. */
  useEffect(() => {
    if (step !== 1 || geo !== "idle") return;
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setGeo("unsupported");
      return;
    }
    setGeo("locating");
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setLat(p.coords.latitude);
        setLon(p.coords.longitude);
        setGeo("ok");
      },
      () => setGeo("denied"),
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60_000 },
    );
  }, [step, geo]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.stopPropagation();
      onClose();
      return;
    }
    if (e.key !== "Tab" || !panelRef.current) return;
    const f = panelRef.current.querySelectorAll<HTMLElement>(
      'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])',
    );
    if (!f.length) return;
    const first = f[0];
    const last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  async function onPickPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoError(null);
    setPhotoBusy(true);
    try {
      const p = await processPhoto(file);
      setPhoto(p.dataUrl);
      setPhotoName(file.name);
      setPhotoQuality(p.quality);
      setPhotoNote(
        p.quality
          ? `Sharp enough and large enough to be worth analysing — +${POINTS.photoQuality} Eco-Points.`
          : Math.max(p.width, p.height) < PHOTO_MIN_EDGE
            ? `Small image (${p.width}×${p.height}). It will still be filed; it just doesn't earn the photo bonus.`
            : "Looks soft or out of focus. It will still be filed; it just doesn't earn the photo bonus.",
      );
    } catch (err) {
      setPhotoError(err instanceof Error ? err.message : "Couldn't add that image.");
      setPhoto(null);
      setPhotoName(null);
      setPhotoQuality(false);
      setPhotoNote(null);
    } finally {
      setPhotoBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  /* The database needs a title and a body; the concept makes the note
     optional. So when there is no note, both are built from what the
     person actually chose — category and place — and nothing is invented
     about what they saw. */
  function buildText(): { title: string; body: string } {
    const trimmed = note.trim();
    const label = category ? CATEGORIES[category].label : "Field report";
    const where = city ?? "unspecified location";
    if (!trimmed) {
      return {
        title: `${label} · ${where}`,
        body: `Filed from ${where} with a photo and no written description. Category and severity were chosen by the reporter; nothing further was stated.`,
      };
    }
    return {
      title: trimmed.length <= 90 ? trimmed : `${trimmed.slice(0, 87).trimEnd()}…`,
      body: trimmed,
    };
  }

  async function submit() {
    if (submitting || !category || !city) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const { title, body } = buildText();
      const report = await createReport({
        category,
        severity,
        title,
        body,
        city,
        photo: photo ?? undefined,
        lat,
        lon,
        photoQuality,
        parentId: parentId || null,
      });
      setCreated(report);
      setStep(4);
      onCreated(report);
    } catch (err) {
      if (err instanceof RateLimitError) {
        setSubmitError(
          err.scope === "hourly"
            ? "You've hit the submission limit for now — everything you entered is still here, try again in a little while."
            : "You've hit today's submission limit — everything you entered is still here, try again tomorrow.",
        );
      } else {
        setSubmitError(err instanceof Error ? err.message : "Submission failed. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  const canAdvance =
    step === 0
      ? true // a photo is strongly encouraged, not enforced — see step 1 copy
      : step === 1
        ? Boolean(city)
        : step === 2
          ? Boolean(category)
          : true;

  return (
    <motion.div
      className="fixed inset-0 z-[60] flex items-stretch sm:items-center justify-center sm:p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
    >
      <button
        type="button"
        aria-label="Close report flow"
        onClick={onClose}
        className="absolute inset-0 bg-abyss/85 backdrop-blur-sm cursor-default"
        tabIndex={-1}
      />

      <motion.div
        ref={panelRef}
        onKeyDown={onKeyDown}
        role="dialog"
        aria-modal="true"
        aria-labelledby="report-flow-title"
        initial={{ opacity: 0, y: 40, scale: 0.99 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 30, scale: 0.99 }}
        transition={{ duration: 0.4, ease: EASE }}
        className="relative w-full sm:max-w-lg h-full sm:h-auto sm:max-h-[92svh] flex flex-col glass-bright panel-glow sm:rounded-2xl ticks overflow-hidden"
      >
        {/* header + step rail */}
        <div className="shrink-0 px-5 sm:px-6 pt-4 pb-3 border-b border-line bg-carbon-2/80 backdrop-blur-md">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="telemetry mb-1.5">
                Step {Math.min(step + 1, 5)} of 5 · {STEP_TITLES[step]}
              </div>
              {/* Not the status name here — the confirmation panel below
                  owns that, and printing «Отправлен» in both places put it
                  on screen twice in a row. */}
              <h2
                id="report-flow-title"
                className="font-[family-name:var(--font-syne)] font-bold text-xl leading-none"
              >
                {step === 4 ? "Report filed" : "File a field report"}
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
          <div className="flex gap-1.5 mt-3.5" aria-hidden>
            {[0, 1, 2, 3, 4].map((i) => (
              <span
                key={i}
                className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                  i <= step ? "bg-emerald" : "bg-carbon-3"
                }`}
              />
            ))}
          </div>
        </div>

        {/* step body */}
        <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-5">
          {step === 0 && (
            <Step
              lede="A photo is what makes a report usable. The grid is a framing guide — keeping the horizon or the subject on a line makes repeat photos of the same place comparable to each other."
            >
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={onPickPhoto}
                className="sr-only"
                id="report-photo"
                aria-label="Take or choose a photo"
              />
              {photo ? (
                <div className="flex flex-col gap-3">
                  <div className="relative rounded-xl overflow-hidden border border-line">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={photo} alt="Report photo preview" className="w-full max-h-[46svh] object-cover" />
                    <ThirdsGrid />
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="text-[12px] text-ink truncate">{photoName}</div>
                      {photoNote && (
                        <div
                          className={`telemetry !text-[9px] mt-0.5 ${
                            photoQuality ? "text-emerald/80" : "text-ink-faint"
                          }`}
                        >
                          {photoNote}
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      className="text-[12px] text-ink-dim hover:text-ink px-2 py-1 transition-colors"
                    >
                      Replace
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={photoBusy}
                  className="relative w-full aspect-[4/5] max-h-[52svh] rounded-xl border border-dashed border-line-bright text-ink-dim hover:text-ink hover:border-emerald/40 transition-colors disabled:opacity-60 grid place-items-center overflow-hidden"
                >
                  <ThirdsGrid />
                  <span className="relative flex flex-col items-center gap-2.5">
                    <svg viewBox="0 0 24 24" className="w-8 h-8" fill="none" aria-hidden>
                      <path d="M3 8.5A1.5 1.5 0 0 1 4.5 7h2.2l1.1-1.8A1.5 1.5 0 0 1 9.1 4.5h5.8a1.5 1.5 0 0 1 1.3.7L17.3 7h2.2A1.5 1.5 0 0 1 21 8.5v9A1.5 1.5 0 0 1 19.5 19h-15A1.5 1.5 0 0 1 3 17.5v-9Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
                      <circle cx="12" cy="12.6" r="3.4" stroke="currentColor" strokeWidth="1.4" />
                    </svg>
                    <span className="text-[13px] font-medium">
                      {photoBusy ? "Processing image…" : "Open camera"}
                    </span>
                    <span className="telemetry !text-[9px]">or choose an existing photo</span>
                  </span>
                </button>
              )}
              {photoError && <FieldError>{photoError}</FieldError>}
              <p className="telemetry !text-[9px] mt-3">
                You can continue without one, but a report with no photo is much harder
                for anyone to act on.
              </p>
            </Step>
          )}

          {step === 1 && (
            <Step lede="Your position is filled in automatically. Drag the pin — or tap the map — if it landed in the wrong place, which is common when the photo was taken from a window or from higher ground.">
              <div className="flex flex-col gap-3">
                <PinMap
                  lat={lat}
                  lon={lon}
                  onChange={(la, lo) => {
                    setLat(la);
                    setLon(lo);
                    setCityOverride(null);
                  }}
                  height={240}
                  label={
                    geo === "locating"
                      ? "Finding your position…"
                      : geo === "denied"
                        ? "Location permission refused — drag the pin to where this was seen."
                        : geo === "unsupported"
                          ? "This browser can't report a position — drag the pin to where this was seen."
                          : "Drag the pin, or tap the map, to correct the location."
                  }
                />
                <div className="readout text-[11px] text-ink-faint">
                  {lat.toFixed(5)}, {lon.toFixed(5)}
                </div>

                <div>
                  <label htmlFor="report-city" className="telemetry mb-2 block">
                    Filed under
                  </label>
                  <div className="relative">
                    <select
                      id="report-city"
                      value={city ?? ""}
                      onChange={(e) => setCityOverride(e.target.value)}
                      className="w-full appearance-none bg-carbon-2/60 border border-line rounded-xl pl-3.5 pr-9 py-2.5 text-sm outline-none focus:border-emerald/40 transition-colors cursor-pointer"
                    >
                      {!city && (
                        <option value="" disabled>
                          Select the nearest monitored city…
                        </option>
                      )}
                      {cities.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                    <svg viewBox="0 0 16 16" className="w-3.5 h-3.5 text-ink-faint absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" aria-hidden>
                      <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <p className="telemetry !text-[9px] mt-2">
                    {derivedCity && !cityOverride
                      ? `Nearest monitored city to the pin. This is the city the report is grouped under.`
                      : `The report is grouped under this city on the map and in the per-city counts.`}
                  </p>
                </div>
              </div>
            </Step>
          )}

          {step === 2 && (
            <Step lede="What kind of problem is this? The five categories match the layers on the map.">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {CATEGORY_KEYS.map((k) => {
                  const c = CATEGORIES[k];
                  const on = category === k;
                  return (
                    <button
                      key={k}
                      type="button"
                      aria-pressed={on}
                      onClick={() => setCategory(k)}
                      className={`flex items-center gap-3 rounded-xl border px-4 py-3.5 text-left transition-colors duration-200 ${
                        on ? TONE_ACTIVE[c.tone] : "border-line text-ink-dim hover:border-line-bright hover:text-ink"
                      }`}
                    >
                      <span className={`text-2xl leading-none ${on ? "" : TONE_TEXT[c.tone]}`}>
                        {c.glyph}
                      </span>
                      <span className="min-w-0">
                        <span className="block text-[14px] font-medium">{c.label}</span>
                        <span className="block telemetry !text-[9px] mt-0.5 truncate">
                          {c.example.replace(/^e\.g\. /, "")}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </Step>
          )}

          {step === 3 && (
            <Step lede="How bad is it, and anything you want to add. The note is optional.">
              <div className="flex flex-col gap-5">
                <fieldset>
                  <legend className="telemetry mb-2">Severity</legend>
                  <div className="grid grid-cols-4 gap-1.5">
                    {SEVERITY_KEYS.map((k) => {
                      const sv = SEVERITIES[k];
                      const on = severity === k;
                      return (
                        <button
                          key={k}
                          type="button"
                          aria-pressed={on}
                          onClick={() => setSeverity(k)}
                          className={`rounded-lg border px-1 py-2.5 text-[12px] font-semibold transition-colors duration-200 ${
                            on ? TONE_ACTIVE[sv.tone] : "border-line text-ink-faint hover:text-ink hover:border-line-bright"
                          }`}
                        >
                          {sv.label}
                        </button>
                      );
                    })}
                  </div>
                </fieldset>

                <div>
                  <label htmlFor="report-note" className="telemetry mb-2 block">
                    Note (optional)
                  </label>
                  <textarea
                    id="report-note"
                    value={note}
                    onChange={(e) => setNote(e.target.value.slice(0, NOTE_MAX))}
                    rows={4}
                    maxLength={NOTE_MAX}
                    placeholder="What did you see? Smells, colours, how long it has been there, anything affected."
                    className="w-full bg-carbon-2/60 border border-line rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-emerald/40 placeholder:text-ink-faint transition-colors resize-none leading-relaxed"
                  />
                  <div className="telemetry !text-[9px] text-right mt-1">
                    {note.length}/{NOTE_MAX}
                  </div>
                </div>

                {ownReports.length > 0 && (
                  <div>
                    <label htmlFor="report-parent" className="telemetry mb-2 block">
                      Is this an update on one of your earlier reports?
                    </label>
                    <div className="relative">
                      <select
                        id="report-parent"
                        value={parentId}
                        onChange={(e) => setParentId(e.target.value)}
                        className="w-full appearance-none bg-carbon-2/60 border border-line rounded-xl pl-3.5 pr-9 py-2.5 text-sm outline-none focus:border-emerald/40 transition-colors cursor-pointer"
                      >
                        <option value="">No — this is a new report</option>
                        {ownReports.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.title.length > 52 ? `${r.title.slice(0, 52)}…` : r.title}
                          </option>
                        ))}
                      </select>
                      <svg viewBox="0 0 16 16" className="w-3.5 h-3.5 text-ink-faint absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" aria-hidden>
                        <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <p className="telemetry !text-[9px] mt-2">
                      An &quot;after&quot; photo following a cleanup or a response is worth
                      +{POINTS.followUp} Eco-Points.
                    </p>
                  </div>
                )}

                {submitError && (
                  <div role="alert" className="rounded-xl border border-coral/40 bg-coral/[0.08] px-4 py-3 text-[13px] text-coral">
                    {submitError}
                  </div>
                )}
              </div>
            </Step>
          )}

          {step === 4 && created && <Confirmation report={created} />}
        </div>

        {/* actions */}
        {step < 4 && (
          <div className="shrink-0 flex items-center gap-2 px-5 sm:px-6 py-4 border-t border-line bg-carbon-2/80 backdrop-blur-md">
            <button
              type="button"
              onClick={() => (step === 0 ? onClose() : setStep((s) => s - 1))}
              className="rounded-xl border border-line text-ink-dim hover:text-ink hover:border-line-bright px-4 py-2.5 text-[13px] font-medium transition-colors"
            >
              {step === 0 ? "Cancel" : "Back"}
            </button>
            <button
              type="button"
              disabled={!canAdvance || submitting}
              onClick={() => (step === 3 ? submit() : setStep((s) => s + 1))}
              className="ml-auto inline-flex items-center gap-2 rounded-xl bg-emerald text-abyss px-5 py-2.5 text-[13px] font-semibold hover:shadow-[0_0_24px_rgba(45,226,166,0.4)] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <span className="w-3.5 h-3.5 rounded-full border-2 border-abyss/40 border-t-abyss animate-spin" />
                  Submitting…
                </>
              ) : step === 3 ? (
                "Submit report"
              ) : (
                "Continue"
              )}
            </button>
          </div>
        )}

        {step === 4 && (
          <div className="shrink-0 px-5 sm:px-6 py-4 border-t border-line bg-carbon-2/80 backdrop-blur-md">
            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-xl bg-emerald text-abyss py-3 text-[13px] font-semibold hover:shadow-[0_0_24px_rgba(45,226,166,0.4)] transition-shadow"
            >
              Back to the feed
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

/* ── Step 5 ───────────────────────────────────────────────────
   The wording here is the whole point of the step. It states exactly what
   happened — the report was stored and is public — and exactly what did
   not: nobody checked it. Anything warmer than this ("Thanks, your report
   has been verified") would be a claim the platform cannot make. */

function Confirmation({ report }: { report: Report }) {
  const meta = STATUS_META.submitted;
  return (
    <div className="flex flex-col items-center text-center gap-5 py-4">
      <span className="grid place-items-center w-16 h-16 rounded-full bg-emerald/12 border border-emerald/35 text-emerald">
        <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none" aria-hidden>
          <path d="M5 12.5l4.5 4.5L19 7.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>

      <div>
        <div className="font-[family-name:var(--font-syne)] font-bold text-2xl">
          {meta.label}
        </div>
        <div className="telemetry !text-[9px] mt-1.5">{meta.gloss} · status ①</div>
      </div>

      {/* Two different things can have happened, and the screen must not
          claim the better one. `remote` is true only for a row Postgres
          handed back; when the datastore was unreachable createReport falls
          back to this browser's storage, and telling that person their
          report is "visible to everyone" would be a straight untruth. */}
      <p className="text-[13.5px] text-ink-dim font-light leading-relaxed max-w-sm">
        {report.remote ? (
          <>
            Your report is stored and is now visible to everyone on the map and in
            the feed.
          </>
        ) : (
          <>
            The shared database could not be reached, so your report is saved in
            this browser only — you can see it, nobody else can. It is not lost,
            but it has not been filed to the network either.
          </>
        )}{" "}
        That is all that has happened to it: nobody has reviewed it, no instrument
        has been compared against it, and Aetheris is not stating that what you
        described is or is not the case.
      </p>

      <div className="w-full rounded-xl border border-line bg-carbon-2/50 p-4 text-left flex flex-col gap-2.5">
        <div className="telemetry !text-[9px]">What can happen next</div>
        <p className="text-[12.5px] text-ink-dim font-light leading-relaxed">
          {/* Status names are quoted, never case-folded: lowercasing
              «AI-контекст добавлен» to fit a sentence also destroyed the
              abbreviation. */}
          If a live feed covers your category and area, Aetheris Analyst will attach
          a reading beside it as context — «{STATUS_META["ai-context"].label}».
          If someone else reports the same category in {report.city} within 72 hours
          from a different device, both move to «{STATUS_META.corroborated.label}» —
          which means independent people described the same thing, not that either of
          you is right.
        </p>
        <p className="telemetry !text-[9px] text-emerald/70">
          +{POINTS.submission} Eco-Points for filing
          {report.photoQuality ? ` · +${POINTS.photoQuality} for the photo` : ""}
          {report.parentId ? ` · +${POINTS.followUp} for the follow-up` : ""}
        </p>
      </div>
    </div>
  );
}

/* ── bits ─────────────────────────────────────────────────────── */

function Step({ lede, children }: { lede: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-[13px] text-ink-dim font-light leading-relaxed">{lede}</p>
      {children}
    </div>
  );
}

/** Rule-of-thirds framing guide, drawn over the camera target and preview. */
function ThirdsGrid() {
  return (
    <span className="absolute inset-0 pointer-events-none" aria-hidden>
      <span className="absolute inset-y-0 left-1/3 w-px bg-ink/15" />
      <span className="absolute inset-y-0 left-2/3 w-px bg-ink/15" />
      <span className="absolute inset-x-0 top-1/3 h-px bg-ink/15" />
      <span className="absolute inset-x-0 top-2/3 h-px bg-ink/15" />
    </span>
  );
}

function FieldError({ children }: { children: React.ReactNode }) {
  return (
    <p role="alert" className="text-[11.5px] text-coral mt-2 flex items-center gap-1.5">
      <svg viewBox="0 0 16 16" className="w-3 h-3 shrink-0" fill="none" aria-hidden>
        <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.3" />
        <path d="M8 5v3.5M8 10.5v.4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
      {children}
    </p>
  );
}
