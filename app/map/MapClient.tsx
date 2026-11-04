"use client";

import dynamic from "next/dynamic";
import { useDict } from "@/lib/useLocale";

/* What the page shows before the map code arrives — and what it shows
   with JavaScript off. A heading and a plain description, not just a
   spinner: it tells a reader what this page is, and it is the page's
   first meaningful paint rather than a loading label. */
function MapLoading() {
  const dict = useDict();
  return (
    <div className="w-full min-h-[100svh] grid place-items-center px-6">
      <div className="max-w-xl text-center flex flex-col gap-4">
        <h1 className="font-[family-name:var(--font-syne)] font-bold text-3xl sm:text-4xl tracking-tight">
          {dict.meta.atlasTitle}
        </h1>
        <p className="text-ink-dim font-light leading-relaxed">{dict.meta.atlasDescription}</p>
        <span className="telemetry animate-[blink_2.2s_steps(2,start)_infinite]">{dict.map.loading}</span>
      </div>
    </div>
  );
}

const EnvironmentalMap = dynamic(
  () => import("@/components/map/EnvironmentalMap"),
  {
    ssr: false,
    loading: () => <MapLoading />,
  },
);

export function MapClient() {
  return <EnvironmentalMap />;
}
