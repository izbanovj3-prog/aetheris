import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Emit a fully static site into `out/` — deployable to any static host
  // (Vercel, Netlify, Cloudflare Pages, GitHub Pages, S3, nginx…).
  output: "export",
  // Static export can't use the default on-demand image optimizer.
  // The app uses no <Image> components, but this keeps export safe.
  images: { unoptimized: true },
  // Emit /map/index.html instead of /map.html so clean URLs resolve
  // correctly on hosts that don't rewrite extensionless paths.
  trailingSlash: true,
  // Build moment for "as of" stamps in source citations. Inlined into both
  // server and client bundles, so prerendered HTML and hydration agree
  // (a module-level `new Date()` would differ between the two).
  env: {
    NEXT_PUBLIC_BUILD_TIME: new Date().toISOString(),
  },
};

export default nextConfig;
