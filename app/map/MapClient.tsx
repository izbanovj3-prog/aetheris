"use client";

import dynamic from "next/dynamic";
import { useDict } from "@/lib/useLocale";

function MapLoading() {
  const dict = useDict();
  return (
    <div className="w-full h-[100svh] grid place-items-center">
      <span className="telemetry animate-[blink_2.2s_steps(2,start)_infinite]">
        {dict.map.loading}
      </span>
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
