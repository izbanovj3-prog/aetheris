import type { Metadata } from "next";
import { Footer } from "@/components/chrome/Footer";
import { BRAND, SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Press kit",
  description:
    "Official Aetheris boilerplate, name usage, logo assets and brand palette for media use.",
  alternates: { canonical: "/press/" },
};

const PALETTE = [
  { name: "Abyss", hex: BRAND.abyss },
  { name: "Carbon", hex: BRAND.carbon },
  { name: "Emerald", hex: BRAND.emerald },
  { name: "Cyan", hex: BRAND.cyan },
  { name: "Atmos", hex: BRAND.atmos },
  { name: "Ink", hex: BRAND.ink },
] as const;

export default function PressPage() {
  return (
    <main className="flex-1">
      <section className="max-w-3xl mx-auto px-6 pt-40 pb-24">
        <span className="telemetry telemetry-bright">Company</span>
        <h1 className="font-[family-name:var(--font-syne)] font-bold tracking-tight text-4xl sm:text-5xl mt-5 mb-6">
          Press kit
        </h1>
        <p className="text-ink-dim text-lg font-light leading-relaxed max-w-xl">
          Covering Aetheris? Use the boilerplate and assets below verbatim.
        </p>

        <div className="mt-14 flex flex-col gap-12">
          <div className="border-t border-line pt-8">
            <h2 className="font-[family-name:var(--font-syne)] font-bold text-2xl mb-3">
              Boilerplate
            </h2>
            <p className="text-ink-dim leading-relaxed font-light">
              {SITE.description}
            </p>
            <p className="text-ink-faint text-sm font-light mt-3">
              The product name is written AETHERIS (all caps) or Aetheris in
              running text; the company is {SITE.creator}.
            </p>
          </div>

          <div className="border-t border-line pt-8">
            <h2 className="font-[family-name:var(--font-syne)] font-bold text-2xl mb-3">
              Assets
            </h2>
            <ul className="flex flex-col gap-2 text-ink-dim font-light">
              <li>
                <a href="/icon.svg" download className="link-sweep hover:text-emerald transition-colors duration-300">
                  Logo mark (SVG)
                </a>
              </li>
              <li>
                <a href="/opengraph-image.png" download className="link-sweep hover:text-emerald transition-colors duration-300">
                  Social card (PNG, 1200×630)
                </a>
              </li>
            </ul>
            {/* TODO: replace with real content — add wordmark lockups, dark/light
                variants and usage rules once the brand package is finalised. */}
          </div>

          <div className="border-t border-line pt-8">
            <h2 className="font-[family-name:var(--font-syne)] font-bold text-2xl mb-4">
              Palette
            </h2>
            <ul className="flex flex-wrap gap-x-8 gap-y-3">
              {PALETTE.map((c) => (
                <li key={c.name} className="flex items-center gap-2.5">
                  <span
                    className="w-3.5 h-3.5 rounded border border-line-bright"
                    style={{ background: c.hex }}
                  />
                  <span className="text-ink-dim text-sm font-light">{c.name}</span>
                  <span className="readout text-xs text-ink-faint uppercase">{c.hex}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="border-t border-line pt-8">
            <h2 className="font-[family-name:var(--font-syne)] font-bold text-2xl mb-3">
              Media enquiries
            </h2>
            {/* TODO: replace with real content — dedicated press contact. */}
            <p className="text-ink-dim leading-relaxed font-light">
              A dedicated press contact is being set up — for now, reach the
              team through the channels on the contact page.
            </p>
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}
