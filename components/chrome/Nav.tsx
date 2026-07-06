"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { LOCALES, localePath, localePrefix, switchPath, type Locale } from "@/lib/i18n";
import { useDict, useLocale } from "@/lib/useLocale";

const LINKS = [
  { href: "/map", key: "atlas" },
  { href: "/dashboard", key: "intelligence" },
  { href: "/assistant", key: "assistant" },
  { href: "/community", key: "community" },
] as const;

const LOCALE_LABELS: Record<Locale, string> = { en: "ENG", ru: "РУС", kk: "ҚАЗ" };

function LangSwitch({ className = "" }: { className?: string }) {
  const pathname = usePathname() ?? "/";
  const locale = useLocale();
  return (
    <span className={`flex items-center gap-2 ${className}`}>
      {LOCALES.map((l) => (
        <Link
          key={l}
          href={switchPath(pathname, l)}
          aria-current={l === locale ? "true" : undefined}
          className={`telemetry transition-colors duration-300 ${
            l === locale ? "telemetry-bright" : "hover:text-ink"
          }`}
        >
          {LOCALE_LABELS[l]}
        </Link>
      ))}
    </span>
  );
}

function UtcClock() {
  const [now, setNow] = useState<string | null>(null);
  useEffect(() => {
    const tick = () =>
      setNow(new Date().toISOString().slice(11, 19) + " UTC");
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <span className="readout text-[11px] text-ink-faint tracking-[0.15em] tabular-nums min-w-[88px] text-right">
      {now ?? "––:––:–– UTC"}
    </span>
  );
}

export function Nav() {
  const pathname = usePathname();
  const locale = useLocale();
  const dict = useDict();
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [pathname]);

  return (
    <header className="fixed top-0 inset-x-0 z-50 flex justify-center px-4 pt-4">
      <nav className="glass-bright panel-glow w-full max-w-5xl rounded-2xl px-4 sm:px-5 py-3 flex items-center gap-4">
        <Link
          href={localePrefix(locale) || "/"}
          className="flex items-center gap-3 group shrink-0"
        >
          <span className="relative grid place-items-center w-8 h-8 rounded-lg border border-line-bright bg-carbon-2 overflow-hidden">
            <span
              className="absolute inset-0 opacity-40 group-hover:opacity-80 transition-opacity duration-500"
              style={{
                background:
                  "radial-gradient(circle at 30% 30%, rgba(45,226,166,0.5), transparent 60%), radial-gradient(circle at 70% 70%, rgba(79,216,247,0.45), transparent 60%)",
              }}
            />
            <span className="relative font-[family-name:var(--font-syne)] font-bold text-sm text-ink">
              Æ
            </span>
          </span>
          <span className="font-[family-name:var(--font-syne)] font-bold tracking-[0.28em] text-[13px] text-ink">
            AETHERIS
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-1 mx-auto">
          {LINKS.map((l) => {
            const href = localePath(l.href, locale);
            const active = pathname.startsWith(href);
            return (
              <Link
                key={l.href}
                href={href}
                className={`relative px-3.5 py-1.5 rounded-lg text-[13px] font-medium transition-colors duration-300 ${
                  active
                    ? "text-ink"
                    : "text-ink-dim hover:text-ink"
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="nav-pill"
                    className="absolute inset-0 rounded-lg bg-carbon-3 border border-line-bright"
                    transition={{ type: "spring", stiffness: 400, damping: 32 }}
                  />
                )}
                <span className="relative">{dict.nav[l.key]}</span>
              </Link>
            );
          })}
        </div>

        <div className="hidden md:flex items-center gap-3 shrink-0">
          <LangSwitch className="mr-1" />
          <span className="flex items-center gap-2">
            <span className="dot-live" />
            <span className="telemetry telemetry-bright">{dict.nav.live}</span>
          </span>
          <UtcClock />
        </div>

        <button
          aria-label="Toggle menu"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="md:hidden ml-auto grid place-items-center w-9 h-9 rounded-lg border border-line text-ink-dim"
        >
          <span className="flex flex-col gap-[5px]">
            <span
              className={`block h-px w-4 bg-current transition-transform duration-300 ${open ? "translate-y-[3px] rotate-45" : ""}`}
            />
            <span
              className={`block h-px w-4 bg-current transition-transform duration-300 ${open ? "-translate-y-[3px] -rotate-45" : ""}`}
            />
          </span>
        </button>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="md:hidden absolute top-[72px] inset-x-4 glass-bright panel-glow rounded-2xl p-3 flex flex-col gap-1"
          >
            {LINKS.map((l) => {
              const href = localePath(l.href, locale);
              return (
                <Link
                  key={l.href}
                  href={href}
                  className={`px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                    pathname.startsWith(href)
                      ? "bg-carbon-3 text-ink border border-line-bright"
                      : "text-ink-dim"
                  }`}
                >
                  {dict.nav[l.key]}
                </Link>
              );
            })}
            <div className="flex items-center justify-between gap-2 px-4 pt-2 pb-1 border-t border-line mt-1">
              <span className="flex items-center gap-2">
                <span className="dot-live" />
                <span className="telemetry telemetry-bright">
                  {dict.nav.menuNetwork}
                </span>
              </span>
              <LangSwitch />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
