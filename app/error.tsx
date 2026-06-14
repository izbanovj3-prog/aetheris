"use client";

import { useEffect } from "react";

/* Route-level error boundary — keeps the global chrome (Nav/atmosphere)
   and offers recovery. Next 16 passes `unstable_retry`, not `reset`. */
export default function Error({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      console.error(error);
    }
  }, [error]);

  return (
    <main className="flex-1 min-h-[100svh] grid place-items-center px-6 py-28">
      <div className="flex flex-col items-center text-center gap-7 max-w-md">
        <div
          className="relative grid place-items-center w-24 h-24 rounded-full border border-coral/30"
          style={{
            background:
              "radial-gradient(circle at 38% 32%, rgba(245,115,98,0.16), transparent 65%)",
          }}
        >
          <svg viewBox="0 0 24 24" className="w-9 h-9 text-coral" fill="none" aria-hidden>
            <path d="M12 8v5M12 16.5v.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            <path d="M12 3 2 20h20L12 3Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
          </svg>
        </div>

        <div className="flex flex-col gap-3">
          <span className="telemetry text-coral">System fault</span>
          <h1 className="font-[family-name:var(--font-syne)] font-bold text-3xl tracking-tight">
            A subsystem went dark
          </h1>
          <p className="text-ink-dim font-light leading-relaxed">
            An unexpected error interrupted this view. The rest of the network is
            unaffected — try re-establishing the feed.
          </p>
        </div>

        <button
          type="button"
          onClick={() => unstable_retry()}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald text-abyss px-5 py-3 text-sm font-semibold hover:shadow-[0_0_30px_rgba(45,226,166,0.4)] transition-shadow duration-300"
        >
          <svg viewBox="0 0 16 16" className="w-4 h-4" fill="none" aria-hidden>
            <path d="M13.5 8a5.5 5.5 0 1 1-1.6-3.9M13.5 2v3h-3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Re-establish feed
        </button>
      </div>
    </main>
  );
}
