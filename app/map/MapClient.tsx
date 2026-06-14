"use client";

import dynamic from "next/dynamic";

const EnvironmentalMap = dynamic(
  () => import("@/components/map/EnvironmentalMap"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[100svh] grid place-items-center">
        <span className="telemetry animate-[blink_2.2s_steps(2,start)_infinite]">
          Acquiring satellite feed
        </span>
      </div>
    ),
  },
);

export function MapClient() {
  return <EnvironmentalMap />;
}
