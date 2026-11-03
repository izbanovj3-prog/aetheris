"use client";

import { getDict, localeFromPathname } from "@/lib/i18n";

/* Catches errors thrown by the root layout itself. It replaces the entire
   document, so it must render its own <html>/<body> and can't rely on the
   app's stylesheet — styles are inlined. Next 16 passes `unstable_retry`. */
/** No providers or router here — read the language straight off the URL. */
function pick() {
  const path = typeof window === "undefined" ? "/" : window.location.pathname;
  const d = getDict(localeFromPathname(path));
  return { d, lang: d === getDict("ru") ? "ru" : d === getDict("kk") ? "kk" : "en" };
}

export default function GlobalError({
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  return (
    <html lang={pick().lang}>
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          backgroundColor: "#030608",
          color: "#e9f3f4",
          fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif",
          padding: "2rem",
        }}
      >
        <div style={{ textAlign: "center", maxWidth: 420 }}>
          <div
            style={{
              fontSize: 14,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: "#f57362",
              marginBottom: 16,
            }}
          >
            {pick().d.errors.errKicker}
          </div>
          <h1 style={{ fontSize: 30, fontWeight: 700, margin: "0 0 12px" }}>
            {pick().d.errors.fatalTitle}
          </h1>
          <p style={{ color: "#93a8b0", lineHeight: 1.6, margin: "0 0 28px" }}>
            {pick().d.errors.fatalBody}
          </p>
          <button
            type="button"
            onClick={() => unstable_retry()}
            style={{
              border: "none",
              cursor: "pointer",
              backgroundColor: "#2de2a6",
              color: "#030608",
              fontWeight: 600,
              fontSize: 14,
              padding: "12px 22px",
              borderRadius: 12,
            }}
          >
            {pick().d.errors.reload}
          </button>
        </div>
      </body>
    </html>
  );
}
