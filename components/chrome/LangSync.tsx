"use client";

import { useEffect } from "react";
import { useLocale } from "@/lib/useLocale";

/** Each tree's root layout prints its own `lang` (app/(en), app/ru, app/kk),
 *  so this is a fallback: it keeps <html lang> right on the one document
 *  shared by every tree, the 404 page, after client-side changes. */
export function LangSync() {
  const locale = useLocale();
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);
  return null;
}
