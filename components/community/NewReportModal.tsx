"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { motion } from "framer-motion";
import { EASE } from "@/components/ui/primitives";
import { getStations } from "@/lib/data";
import {
  CATEGORIES,
  SEVERITIES,
  createReport,
  downscaleImage,
  type Report,
  type ReportCategory,
  type Severity,
  type Tone,
} from "@/lib/reports";

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

type Errors = Partial<Record<"category" | "title" | "body" | "city" | "photo", string>>;

export function NewReportModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (r: Report) => void;
}) {
  const [category, setCategory] = useState<ReportCategory | null>(null);
  const [severity, setSeverity] = useState<Severity>("moderate");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [city, setCity] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const [photoName, setPhotoName] = useState<string | null>(null);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const panelRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);

  const cities = useMemo(
    () => [...new Set(getStations().map((s) => s.name))].sort((a, b) => a.localeCompare(b)),
    [],
  );

  /* focus management + body scroll lock + Escape */
  useEffect(() => {
    restoreFocusRef.current = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const t = window.setTimeout(() => titleRef.current?.focus(), 60);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.clearTimeout(t);
      restoreFocusRef.current?.focus?.();
    };
  }, []);

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
    setErrors((p) => ({ ...p, photo: undefined }));
    setPhotoBusy(true);
    try {
      const dataUrl = await downscaleImage(file);
      setPhoto(dataUrl);
      setPhotoName(file.name);
    } catch (err) {
      setErrors((p) => ({ ...p, photo: err instanceof Error ? err.message : "Couldn't add that image." }));
      setPhoto(null);
      setPhotoName(null);
    } finally {
      setPhotoBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function validate(): Errors {
    const e: Errors = {};
    if (!category) e.category = "Choose a category.";
    if (title.trim().length < 6) e.title = "Add a clear title (at least 6 characters).";
    if (body.trim().length < 12) e.body = "Describe what you observed (at least 12 characters).";
    if (!city) e.city = "Select the city or area.";
    return e;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (submitting) return;
    const e2 = validate();
    setErrors(e2);
    if (Object.keys(e2).length) {
      // surface the first error to assistive tech + focus
      if (e2.title) titleRef.current?.focus();
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      // brief processing pass (validation + would-be upload); persistence is real
      await new Promise((r) => setTimeout(r, 650));
      const report = await createReport({
        category: category!,
        severity,
        title,
        body,
        city,
        photo: photo ?? undefined,
      });
      onCreated(report);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Submission failed. Please try again.");
      setSubmitting(false);
    }
  }

  const activeCat = category ? CATEGORIES[category] : null;

  return (
    <motion.div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      aria-hidden={false}
    >
      {/* backdrop */}
      <button
        type="button"
        aria-label="Close report form"
        onClick={onClose}
        className="absolute inset-0 bg-abyss/80 backdrop-blur-sm cursor-default"
        tabIndex={-1}
      />

      {/* panel */}
      <motion.div
        ref={panelRef}
        onKeyDown={onKeyDown}
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-report-title"
        initial={{ opacity: 0, y: 40, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 30, scale: 0.98 }}
        transition={{ duration: 0.4, ease: EASE }}
        className="relative w-full sm:max-w-lg max-h-[92svh] overflow-y-auto glass-bright panel-glow rounded-t-3xl sm:rounded-2xl ticks"
      >
        <form onSubmit={onSubmit} noValidate>
          {/* header */}
          <div className="sticky top-0 z-10 flex items-start justify-between gap-3 px-5 sm:px-6 py-4 border-b border-line bg-carbon-2/80 backdrop-blur-md rounded-t-3xl sm:rounded-t-2xl">
            <div>
              <div className="telemetry mb-1.5">File a field report</div>
              <h2
                id="new-report-title"
                className="font-[family-name:var(--font-syne)] font-bold text-xl leading-none"
              >
                New report
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

          <div className="px-5 sm:px-6 py-5 flex flex-col gap-5">
            {/* category */}
            <fieldset>
              <legend className="telemetry mb-2.5">
                Category <span className="text-coral">*</span>
              </legend>
              <div className="flex flex-wrap gap-2">
                {CATEGORY_KEYS.map((k) => {
                  const c = CATEGORIES[k];
                  const on = category === k;
                  return (
                    <button
                      key={k}
                      type="button"
                      aria-pressed={on}
                      onClick={() => {
                        setCategory(k);
                        setErrors((p) => ({ ...p, category: undefined }));
                      }}
                      className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-[13px] font-medium transition-colors duration-200 ${
                        on ? TONE_ACTIVE[c.tone] : "border-line text-ink-dim hover:border-line-bright hover:text-ink"
                      }`}
                    >
                      <span className={on ? "" : TONE_TEXT[c.tone]}>{c.glyph}</span>
                      {c.label}
                    </button>
                  );
                })}
              </div>
              {errors.category && <FieldError id="err-category">{errors.category}</FieldError>}
            </fieldset>

            {/* title */}
            <Field label="Title" required error={errors.title} htmlFor="report-title">
              <input
                id="report-title"
                ref={titleRef}
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (errors.title) setErrors((p) => ({ ...p, title: undefined }));
                }}
                maxLength={90}
                placeholder={activeCat ? activeCat.example : "e.g. Heavy smog over Almaty after a morning inversion"}
                aria-invalid={!!errors.title}
                className="w-full bg-carbon-2/60 border border-line rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-emerald/40 placeholder:text-ink-faint transition-colors"
              />
            </Field>

            {/* description */}
            <Field label="Description" required error={errors.body} htmlFor="report-body">
              <textarea
                id="report-body"
                value={body}
                onChange={(e) => {
                  setBody(e.target.value);
                  if (errors.body) setErrors((p) => ({ ...p, body: undefined }));
                }}
                rows={4}
                maxLength={600}
                placeholder="What did you observe? Where, when, and how severe? Note any smells, colours, or affected wildlife."
                aria-invalid={!!errors.body}
                className="w-full bg-carbon-2/60 border border-line rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-emerald/40 placeholder:text-ink-faint transition-colors resize-none leading-relaxed"
              />
              <div className="telemetry !text-[9px] text-right mt-1">{body.length}/600</div>
            </Field>

            {/* city + severity */}
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="City / area" required error={errors.city} htmlFor="report-city">
                <div className="relative">
                  <select
                    id="report-city"
                    value={city}
                    onChange={(e) => {
                      setCity(e.target.value);
                      if (errors.city) setErrors((p) => ({ ...p, city: undefined }));
                    }}
                    aria-invalid={!!errors.city}
                    className="w-full appearance-none bg-carbon-2/60 border border-line rounded-xl pl-3.5 pr-9 py-2.5 text-sm outline-none focus:border-emerald/40 transition-colors cursor-pointer"
                  >
                    <option value="" disabled>
                      Select a city…
                    </option>
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
              </Field>

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
                        className={`rounded-lg border px-1 py-2 text-[11px] font-semibold transition-colors duration-200 ${
                          on ? TONE_ACTIVE[sv.tone] : "border-line text-ink-faint hover:text-ink hover:border-line-bright"
                        }`}
                      >
                        {sv.label}
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            </div>

            {/* photo (optional) */}
            <div>
              <div className="telemetry mb-2">Photo (optional)</div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={onPickPhoto}
                className="sr-only"
                id="report-photo"
                aria-label="Attach a photo"
              />
              {photo ? (
                <div className="flex items-center gap-3 rounded-xl border border-line p-2.5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photo} alt="Report attachment preview" className="w-14 h-14 rounded-lg object-cover border border-line-bright" />
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] text-ink truncate">{photoName}</div>
                    <div className="telemetry !text-[9px] text-emerald/70 mt-0.5">Attached · downscaled</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setPhoto(null);
                      setPhotoName(null);
                    }}
                    className="text-[12px] text-ink-dim hover:text-coral px-2 py-1 transition-colors"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={photoBusy}
                  className="w-full flex items-center justify-center gap-2 rounded-xl border border-dashed border-line-bright text-ink-dim hover:text-ink hover:border-emerald/40 py-3 text-[13px] transition-colors disabled:opacity-60"
                >
                  <svg viewBox="0 0 16 16" className="w-4 h-4" fill="none" aria-hidden>
                    <path d="M2 11l3-3 2 2 4-4 3 3M2 4.5h12M4 4.5V3h8v1.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {photoBusy ? "Processing image…" : "Add a photo"}
                </button>
              )}
              {errors.photo && <FieldError id="err-photo">{errors.photo}</FieldError>}
            </div>

            {submitError && (
              <div role="alert" className="rounded-xl border border-coral/40 bg-coral/[0.08] px-4 py-3 text-[13px] text-coral">
                {submitError}
              </div>
            )}
          </div>

          {/* actions */}
          <div className="sticky bottom-0 flex items-center justify-between gap-3 px-5 sm:px-6 py-4 border-t border-line bg-carbon-2/80 backdrop-blur-md">
            <span className="telemetry !text-[9px] hidden sm:block">
              Cross-checked against sensors before verification
            </span>
            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-line text-ink-dim hover:text-ink hover:border-line-bright px-4 py-2.5 text-[13px] font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald text-abyss px-5 py-2.5 text-[13px] font-semibold hover:shadow-[0_0_24px_rgba(45,226,166,0.4)] transition-all disabled:opacity-70 disabled:cursor-wait"
              >
                {submitting ? (
                  <>
                    <span className="w-3.5 h-3.5 rounded-full border-2 border-abyss/40 border-t-abyss animate-spin" />
                    Submitting…
                  </>
                ) : (
                  "Submit report"
                )}
              </button>
            </div>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

/* ── small field wrappers ─────────────────────────────────────── */

function Field({
  label,
  required,
  error,
  htmlFor,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="telemetry mb-2 block">
        {label} {required && <span className="text-coral">*</span>}
      </label>
      {children}
      {error && <FieldError id={`err-${htmlFor}`}>{error}</FieldError>}
    </div>
  );
}

function FieldError({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <p id={id} role="alert" className="text-[11.5px] text-coral mt-1.5 flex items-center gap-1.5">
      <svg viewBox="0 0 16 16" className="w-3 h-3 shrink-0" fill="none" aria-hidden>
        <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.3" />
        <path d="M8 5v3.5M8 10.5v.4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
      {children}
    </p>
  );
}
