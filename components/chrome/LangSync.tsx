"use client";

import { useEffect } from "react";
import { useLocale } from "@/lib/useLocale";

/** The root layout owns the single <html> tag, so per-locale `lang` can't be
 *  set statically without moving EN off its indexed URLs — sync it on the
 *  client instead (prerendered HTML keeps lang="en"; /ru and /kk correct it
 *  after hydration, and crawlers read hreflang + content language anyway). */
export function LangSync() {
  const locale = useLocale();
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);
  return null;
}
