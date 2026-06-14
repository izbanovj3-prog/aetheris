import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Signal lost",
  description: "This coordinate isn't on the network.",
};

export default function NotFound() {
  return (
    <main className="flex-1 min-h-[100svh] grid place-items-center px-6 py-28">
      <div className="flex flex-col items-center text-center gap-7 max-w-md">
        <div
          className="relative grid place-items-center w-28 h-28 rounded-full border border-line-bright"
          style={{
            background:
              "radial-gradient(circle at 38% 32%, rgba(79,157,222,0.18), transparent 65%)",
          }}
        >
          <span className="readout text-3xl font-medium text-cyan">404</span>
          <span className="absolute inset-0 rounded-full border border-cyan/20 animate-[pulse-slow_4s_ease-in-out_infinite]" />
        </div>

        <div className="flex flex-col gap-3">
          <span className="telemetry telemetry-bright">Telemetry · no fix</span>
          <h1 className="font-[family-name:var(--font-syne)] font-bold text-3xl sm:text-4xl tracking-tight">
            Signal lost
          </h1>
          <p className="text-ink-dim font-light leading-relaxed">
            This coordinate isn&apos;t on the network. The page may have moved, or
            the sensor never reported in.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl bg-emerald text-abyss px-5 py-3 text-sm font-semibold hover:shadow-[0_0_30px_rgba(45,226,166,0.4)] transition-shadow duration-300"
          >
            Return to base
          </Link>
          <Link
            href="/map"
            className="inline-flex items-center gap-2 rounded-xl glass border-line-bright text-ink px-5 py-3 text-sm font-semibold hover:border-emerald/40 hover:text-emerald transition-colors duration-300"
          >
            Open the Atlas
          </Link>
        </div>
      </div>
    </main>
  );
}
