"use client";

import Link from "next/link";
import { localePath } from "@/lib/i18n";
import { useDict, useLocale } from "@/lib/useLocale";

/* 404 and error screens in the language of the address that failed:
   the static 404.html is served for every missing path, so the language
   is read from the URL in the browser (/ru/… → Russian). Without JS the
   English text from the prerender stays, which is the safe default. */

const button =
  "inline-flex items-center gap-2 rounded-xl bg-emerald text-abyss px-5 py-3 text-sm font-semibold hover:shadow-[0_0_30px_rgba(45,226,166,0.4)] transition-shadow duration-300";
const ghost =
  "inline-flex items-center gap-2 rounded-xl glass border-line-bright text-ink px-5 py-3 text-sm font-semibold hover:border-emerald/40 hover:text-emerald transition-colors duration-300";

export function NotFoundScreen() {
  const e = useDict().errors;
  const locale = useLocale();
  return (
    <main className="flex-1 min-h-[100svh] grid place-items-center px-6 py-28">
      <div className="flex flex-col items-center text-center gap-7 max-w-md">
        <div className="relative grid place-items-center w-28 h-28 rounded-full border border-line-bright">
          <span className="readout text-3xl font-medium text-cyan">404</span>
        </div>
        <div className="flex flex-col gap-3">
          <span className="telemetry telemetry-bright">{e.nfKicker}</span>
          <h1 className="font-[family-name:var(--font-syne)] font-bold text-3xl sm:text-4xl tracking-tight">
            {e.nfTitle}
          </h1>
          <p className="text-ink-dim font-light leading-relaxed">{e.nfBody}</p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link href={localePath("/", locale)} className={button}>
            {e.home}
          </Link>
          <Link href={localePath("/map", locale)} className={ghost}>
            {e.atlas}
          </Link>
        </div>
      </div>
    </main>
  );
}

export function ErrorScreen({ onRetry }: { onRetry: () => void }) {
  const e = useDict().errors;
  return (
    <main className="flex-1 min-h-[100svh] grid place-items-center px-6 py-28">
      <div className="flex flex-col items-center text-center gap-7 max-w-md">
        <div className="flex flex-col gap-3">
          <span className="telemetry text-coral">{e.errKicker}</span>
          <h1 className="font-[family-name:var(--font-syne)] font-bold text-3xl tracking-tight">{e.errTitle}</h1>
          <p className="text-ink-dim font-light leading-relaxed">{e.errBody}</p>
        </div>
        <button type="button" onClick={onRetry} className={button}>
          {e.retry}
        </button>
      </div>
    </main>
  );
}
