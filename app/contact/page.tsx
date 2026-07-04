import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/chrome/Footer";

export const metadata: Metadata = {
  title: "Contact",
  description: "How to reach the Aetheris team.",
};

// TODO: replace with real content — add the real inbox addresses for
// general, press and partnership mail once the domain mailboxes exist
// (deliberately no invented emails here).
const CHANNELS = [
  {
    title: "Field reports & community",
    body: "Seen a pollution event, a die-off, an illegal discharge? File a geo-tagged report — it lands directly in the verification queue.",
    action: { label: "Open the community hub", href: "/community" },
  },
  {
    title: "Platform & data questions",
    body: "The AI analyst reads every layer of the live model and answers with citations back to the sensors — usually the fastest route.",
    action: { label: "Ask the analyst", href: "/assistant" },
  },
  {
    title: "Press & partnerships",
    body: "Direct mail channels are being set up. Until then, start from the press kit or the community hub and we will route you.",
    action: { label: "View the press kit", href: "/press" },
  },
];

export default function ContactPage() {
  return (
    <main className="flex-1">
      <section className="max-w-3xl mx-auto px-6 pt-40 pb-24">
        <span className="telemetry telemetry-bright">Company</span>
        <h1 className="font-[family-name:var(--font-syne)] font-bold tracking-tight text-4xl sm:text-5xl mt-5 mb-6">
          Contact
        </h1>
        <p className="text-ink-dim text-lg font-light leading-relaxed max-w-xl">
          Reach the Aetheris team — pick the channel that fits.
        </p>

        <div className="mt-14 flex flex-col gap-12">
          {CHANNELS.map((c) => (
            <div key={c.title} className="border-t border-line pt-8">
              <h2 className="font-[family-name:var(--font-syne)] font-bold text-2xl mb-3">
                {c.title}
              </h2>
              <p className="text-ink-dim leading-relaxed font-light mb-4 max-w-xl">
                {c.body}
              </p>
              <Link
                href={c.action.href}
                className="text-sm text-ink-dim hover:text-emerald transition-colors duration-300 link-sweep"
              >
                {c.action.label} →
              </Link>
            </div>
          ))}
        </div>
      </section>
      <Footer />
    </main>
  );
}
