"use client";

import Link from "next/link";
import { motion, type Variants } from "framer-motion";
import type { ReactNode } from "react";

/* ── Motion grammar ───────────────────────────────────────────
   One easing family across the product: long, weighted ease-out.
   Reveals stagger upward like telemetry coming online. */

export const EASE = [0.22, 1, 0.36, 1] as const;

export const riseIn: Variants = {
  hidden: { opacity: 0, y: 26 },
  show: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.9, delay: i * 0.08, ease: EASE },
  }),
};

export function Reveal({
  children,
  index = 0,
  className,
  once = true,
}: {
  children: ReactNode;
  index?: number;
  className?: string;
  once?: boolean;
}) {
  return (
    <motion.div
      className={className}
      variants={riseIn}
      custom={index}
      initial="hidden"
      whileInView="show"
      viewport={{ once, margin: "-60px" }}
    >
      {children}
    </motion.div>
  );
}

/* ── Telemetry tag — small mono section label ─────────────── */

export function TelemetryTag({
  children,
  tone = "default",
}: {
  children: ReactNode;
  tone?: "default" | "emerald" | "cyan" | "amber" | "coral";
}) {
  const tones = {
    default: "text-ink-faint border-line",
    emerald: "text-emerald border-emerald/25",
    cyan: "text-cyan border-cyan/25",
    amber: "text-amber border-amber/25",
    coral: "text-coral border-coral/25",
  };
  return (
    <span
      className={`telemetry inline-flex items-center gap-2 border rounded-full px-3 py-1.5 ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

/* ── Section heading ──────────────────────────────────────── */

export function SectionHeading({
  tag,
  title,
  lede,
  align = "left",
}: {
  tag: string;
  title: ReactNode;
  lede?: string;
  align?: "left" | "center";
}) {
  return (
    <div
      className={`flex flex-col gap-5 ${align === "center" ? "items-center text-center" : ""}`}
    >
      <Reveal>
        <TelemetryTag tone="emerald">
          <span className="w-1 h-1 rounded-full bg-emerald" />
          {tag}
        </TelemetryTag>
      </Reveal>
      <Reveal index={1}>
        <h2 className="font-[family-name:var(--font-syne)] font-bold text-3xl sm:text-4xl lg:text-5xl leading-[1.08] tracking-tight max-w-2xl">
          {title}
        </h2>
      </Reveal>
      {lede && (
        <Reveal index={2}>
          <p className="text-ink-dim text-base sm:text-lg leading-relaxed max-w-xl font-light">
            {lede}
          </p>
        </Reveal>
      )}
    </div>
  );
}

/* ── Glass card ───────────────────────────────────────────── */

export function GlassCard({
  children,
  className = "",
  bright = false,
  ticks = false,
}: {
  children: ReactNode;
  className?: string;
  bright?: boolean;
  ticks?: boolean;
}) {
  return (
    <div
      className={`${bright ? "glass-bright" : "glass"} panel-glow rounded-2xl ${ticks ? "ticks" : ""} ${className}`}
    >
      {children}
    </div>
  );
}

/* ── Buttons ──────────────────────────────────────────────── */

export function GlowButton({
  href,
  children,
  variant = "primary",
  className = "",
  onClick,
}: {
  href?: string;
  children: ReactNode;
  variant?: "primary" | "ghost";
  className?: string;
  onClick?: () => void;
}) {
  const base =
    "group relative inline-flex items-center justify-center gap-2.5 rounded-xl px-6 py-3.5 text-sm font-semibold tracking-wide transition-all duration-300 overflow-hidden";
  const styles =
    variant === "primary"
      ? "bg-emerald text-abyss hover:shadow-[0_0_36px_rgba(45,226,166,0.45)] hover:-translate-y-px"
      : "glass border-line-bright text-ink hover:border-emerald/40 hover:text-emerald hover:-translate-y-px";

  const inner = (
    <>
      {variant === "primary" && (
        <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out bg-gradient-to-r from-transparent via-white/30 to-transparent" />
      )}
      <span className="relative">{children}</span>
      <svg
        className="relative w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-0.5"
        viewBox="0 0 16 16"
        fill="none"
        aria-hidden
      >
        <path
          d="M3 8h10M9 4l4 4-4 4"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </>
  );

  if (href) {
    return (
      <Link href={href} className={`${base} ${styles} ${className}`}>
        {inner}
      </Link>
    );
  }
  return (
    <button onClick={onClick} className={`${base} ${styles} ${className}`}>
      {inner}
    </button>
  );
}

/* ── Animated readout number ──────────────────────────────── */

export function StatReadout({
  value,
  suffix = "",
  label,
  tone = "emerald",
  decimals = 0,
  source,
}: {
  value: number;
  suffix?: string;
  label: string;
  tone?: "emerald" | "cyan" | "atmos" | "amber";
  decimals?: number;
  /** Attribution shown as an ⓘ tooltip next to the label. */
  source?: string;
}) {
  const toneClass = {
    emerald: "text-emerald",
    cyan: "text-cyan",
    atmos: "text-atmos",
    amber: "text-amber",
  }[tone];

  return (
    <div className="flex flex-col gap-1.5">
      <motion.span
        className={`readout text-3xl sm:text-4xl font-medium ${toneClass}`}
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
      >
        <Counter target={value} decimals={decimals} />
        <span className="text-xl">{suffix}</span>
      </motion.span>
      <span className="telemetry">
        {label}
        {source && <SourceNote source={source} className="ml-1.5" />}
      </span>
    </div>
  );
}

/* ── Inline source citation ───────────────────────────────── */

// Inlined at build by next.config.ts `env` — a static export has no runtime
// clock that agrees between prerender and hydration.
const BUILT_AT = process.env.NEXT_PUBLIC_BUILD_TIME;

/** Small ⓘ marker stating where a headline number comes from. */
export function SourceNote({
  source,
  asOf,
  className = "",
}: {
  source: string;
  /** ISO timestamp of the reading; defaults to the build moment. */
  asOf?: string;
  className?: string;
}) {
  const note = `Source: ${source} · as of ${asOf ?? BUILT_AT ?? "build time unavailable"}`;
  return (
    <span
      role="note"
      tabIndex={0}
      title={note}
      aria-label={note}
      className={`inline-block align-[-0.125em] cursor-help text-ink-faint ${className}`}
    >
      <svg viewBox="0 0 12 12" className="w-3 h-3" fill="none" aria-hidden>
        <circle cx="6" cy="6" r="5.25" stroke="currentColor" strokeWidth="1" />
        <path
          d="M6 5.4v3.1"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
        />
        <circle cx="6" cy="3.4" r="0.7" fill="currentColor" />
      </svg>
    </span>
  );
}

import { useEffect, useRef, useState } from "react";
import { useInView, useReducedMotion } from "framer-motion";

function Counter({ target, decimals }: { target: number; decimals: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const reduce = useReducedMotion();
  // Seed with the real value: the static export ships this initial render,
  // so crawlers and users without JS get the number, never a "0".
  const [val, setVal] = useState(target);

  useEffect(() => {
    if (reduce) {
      setVal(target);
      return;
    }
    if (!inView) {
      // JS is running, so the count-up will play — arm it back to zero while
      // the readout is still off-screen (and opacity-0 via the parent).
      setVal(0);
      return;
    }
    const t0 = performance.now();
    const dur = 1600;
    let raf: number;
    const step = (t: number) => {
      const p = Math.min((t - t0) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 4);
      setVal(target * eased);
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [inView, target, reduce]);

  return (
    <span ref={ref}>
      {val.toLocaleString("en-US", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}
    </span>
  );
}
