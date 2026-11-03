"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

/* The particle globe is decoration, and it is the heaviest thing on the
   site (three.js + react-three-fiber + the land polygons). It is loaded
   only when it can be afforded and is wanted:

   • never under prefers-reduced-motion, Save-Data, or without WebGL;
   • never on a weak device (≤ 2 CPU threads, or < 4 GB reported memory),
     or where WebGL is software-rendered (SwiftShader / llvmpipe) — there
     every frame of the globe is CPU work that blocks the page;
   • never on a narrow screen (< 1024 px): there the globe sits behind
     the text, and phones are where the download and battery cost most;
   • otherwise only once the page is idle, so it never competes with the
     text and first interaction for the network and the main thread.

   Every other case gets a static CSS sphere in the same place, so the
   layout does not change and nothing has to be downloaded. */

const Globe = dynamic(() => import("./Globe"), { ssr: false });

type Mode = "pending" | "globe" | "static";

function canAffordGlobe(): boolean {
  if (typeof window === "undefined") return false;
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return false;
  const nav = navigator as Navigator & {
    connection?: { saveData?: boolean };
    deviceMemory?: number;
  };
  if (nav.connection?.saveData) return false;
  if (typeof nav.deviceMemory === "number" && nav.deviceMemory < 4) return false;
  if (typeof nav.hardwareConcurrency === "number" && nav.hardwareConcurrency <= 2) return false;
  if (!window.matchMedia?.("(min-width: 1024px)").matches) return false;
  try {
    const c = document.createElement("canvas");
    const gl = (c.getContext("webgl2") || c.getContext("webgl")) as WebGLRenderingContext | null;
    if (!gl) return false;
    const info = gl.getExtension("WEBGL_debug_renderer_info");
    const renderer = info ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)) : "";
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    if (/swiftshader|llvmpipe|software/i.test(renderer)) return false;
  } catch {
    return false;
  }
  return true;
}

export function GlobeSlot({ className = "" }: { className?: string }) {
  const [mode, setMode] = useState<Mode>("pending");

  useEffect(() => {
    if (!canAffordGlobe()) {
      setMode("static");
      return;
    }
    const w = window as Window & {
      requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };
    if (w.requestIdleCallback) {
      const id = w.requestIdleCallback(() => setMode("globe"), { timeout: 3000 });
      return () => w.cancelIdleCallback?.(id);
    }
    const t = window.setTimeout(() => setMode("globe"), 1500);
    return () => window.clearTimeout(t);
  }, []);

  if (mode === "globe") return <Globe className={className} />;
  return (
    <div className={`grid place-items-center ${className}`} aria-hidden data-globe={mode}>
      <div
        className="aspect-square w-[78%] rounded-full opacity-70"
        style={{
          background:
            "radial-gradient(circle at 38% 32%, color-mix(in srgb, var(--cyan) 22%, transparent), transparent 58%), radial-gradient(circle at 50% 50%, color-mix(in srgb, var(--emerald) 10%, transparent), transparent 70%)",
          boxShadow: "inset 0 0 80px color-mix(in srgb, var(--cyan) 12%, transparent)",
        }}
      />
    </div>
  );
}
