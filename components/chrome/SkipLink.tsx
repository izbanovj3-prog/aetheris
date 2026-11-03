"use client";

import { useDict } from "@/lib/useLocale";

/** "Skip to main content", in the page's language. */
export function SkipLink() {
  return (
    <a href="#main-content" className="skip-link">
      {useDict().skipLink}
    </a>
  );
}
