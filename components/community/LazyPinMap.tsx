"use client";

import dynamic from "next/dynamic";
import type { ComponentProps } from "react";
import type { PinMap as PinMapImpl } from "./PinMap";

/* MapLibre is ~1 MB of script and 70 KB of CSS. The pin map only appears
   inside the report and event forms, so it is loaded when a form first
   shows it — not with /community/, where its stylesheet used to block the
   first paint. The box keeps the map's height while the chunk arrives. */

type Props = ComponentProps<typeof PinMapImpl>;

const Inner = dynamic(() => import("./PinMap").then((m) => m.PinMap), { ssr: false });

export function PinMap(props: Props) {
  return (
    <div style={{ minHeight: props.height ?? 220 }}>
      <Inner {...props} />
    </div>
  );
}
