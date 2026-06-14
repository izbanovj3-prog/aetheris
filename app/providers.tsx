"use client";

import { MotionConfig } from "framer-motion";
import type { ReactNode } from "react";

/* App-wide motion governor. `reducedMotion="user"` makes every Framer
   Motion animation honour the OS "reduce motion" setting automatically —
   transform/layout animations are skipped for those users, which covers
   the ticker, hero parallax, scroll cue, nav pill and panel reveals in
   one place (the CSS keyframe FX are already gated separately). */
export function Providers({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
