"use client";

import { useEffect, useState } from "react";
import { useLocale } from "@/lib/useLocale";
import type { Locale } from "@/lib/i18n";

/**
 * Reading controls: text size (A / A+ / A++) and a light high-contrast theme.
 *
 * Review feedback was that text on the dark ground was hard to read and too
 * small even when enlarged. The defaults were raised, and this lets a reader
 * go further. State lives on <html> (data-text, data-theme) so plain CSS can
 * react to it; the same attributes are applied before first paint by the
 * inline script in app/layout.tsx. localStorage is a convenience only — every
 * access is guarded, the page renders correctly without it.
 */

type Size = "1" | "2" | "3";
type Theme = "dark" | "light";

export const READING_LABELS: Record<Locale, { group: string; size: string[]; theme: string; light: string; dark: string }> = {
  en: {
    group: "Reading settings",
    size: ["Normal text size", "Larger text size", "Largest text size"],
    theme: "Colour theme",
    light: "Light theme",
    dark: "Dark theme",
  },
  ru: {
    group: "Настройки чтения",
    size: ["Обычный размер текста", "Крупный текст", "Самый крупный текст"],
    theme: "Цветовая тема",
    light: "Светлая тема",
    dark: "Тёмная тема",
  },
  kk: {
    group: "Оқу баптаулары",
    size: ["Қалыпты мәтін өлшемі", "Ірі мәтін", "Ең ірі мәтін"],
    theme: "Түс тақырыбы",
    light: "Жарық тақырып",
    dark: "Қараңғы тақырып",
  },
};

function safeSet(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* private mode or blocked storage: the setting just won't persist */
  }
}

export function ReadingControls({ className = "" }: { className?: string }) {
  const locale = useLocale();
  const t = READING_LABELS[locale] ?? READING_LABELS.en;
  const [size, setSize] = useState<Size>("1");
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    const d = document.documentElement;
    let s: string | null = null;
    let h: string | null = null;
    try {
      s = localStorage.getItem("aeth-text");
      h = localStorage.getItem("aeth-theme");
    } catch {
      /* storage blocked: fall back to whatever the page already carries */
    }
    // Re-apply from storage: if React ever re-renders the document root
    // (a hydration error does), attributes set by the inline script are lost.
    if (s === "2" || s === "3") d.setAttribute("data-text", s);
    if (h === "light") d.setAttribute("data-theme", "light");
    const cur = d.getAttribute("data-text");
    setSize(cur === "2" || cur === "3" ? cur : "1");
    setTheme(d.getAttribute("data-theme") === "light" ? "light" : "dark");
  }, []);

  const pickSize = (v: Size) => {
    const d = document.documentElement;
    if (v === "1") d.removeAttribute("data-text");
    else d.setAttribute("data-text", v);
    safeSet("aeth-text", v);
    setSize(v);
  };

  const toggleTheme = () => {
    const next: Theme = theme === "light" ? "dark" : "light";
    const d = document.documentElement;
    if (next === "light") d.setAttribute("data-theme", "light");
    else d.removeAttribute("data-theme");
    safeSet("aeth-theme", next);
    setTheme(next);
  };

  const btn =
    "grid place-items-center min-w-9 h-9 px-1.5 rounded-lg border font-semibold leading-none transition-colors";

  return (
    <div role="group" aria-label={t.group} className={`flex items-center gap-1.5 ${className}`}>
      {(["1", "2", "3"] as Size[]).map((v, i) => (
        <button
          key={v}
          type="button"
          aria-label={t.size[i]}
          aria-pressed={size === v}
          onClick={() => pickSize(v)}
          className={`${btn} ${
            size === v
              ? "border-line-bright bg-carbon-3 text-ink"
              : "border-line text-ink-dim hover:text-ink"
          }`}
          style={{ fontSize: 14 + i * 3 }}
        >
          A{i === 0 ? "" : i === 1 ? "+" : "++"}
        </button>
      ))}
      <button
        type="button"
        aria-label={`${t.theme}: ${theme === "light" ? t.dark : t.light}`}
        aria-pressed={theme === "light"}
        onClick={toggleTheme}
        className={`${btn} ${
          theme === "light"
            ? "border-line-bright bg-carbon-3 text-ink"
            : "border-line text-ink-dim hover:text-ink"
        }`}
        style={{ fontSize: 16 }}
        title={theme === "light" ? t.dark : t.light}
      >
        {theme === "light" ? "☾" : "☀"}
      </button>
    </div>
  );
}
