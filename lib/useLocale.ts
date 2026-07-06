"use client";

import { usePathname } from "next/navigation";
import { getDict, localeFromPathname, type Dict, type Locale } from "./i18n";
import { getPageContent, type PageContent } from "./content";

/** Locale is a function of the URL — no context, no prop threading. */
export function useLocale(): Locale {
  return localeFromPathname(usePathname() ?? "/");
}

export function useDict(): Dict {
  return getDict(useLocale());
}

export function usePageContent(): PageContent {
  return getPageContent(useLocale());
}
