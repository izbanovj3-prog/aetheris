import type { Metadata } from "next";
import { Footer } from "@/components/chrome/Footer";

export const metadata: Metadata = {
  title: "Mission",
  description:
    "Why Aetheris exists: making Kazakhstan's environment legible to the people who live in it.",
};

export default function MissionPage() {
  return (
    <main className="flex-1">
      <section className="max-w-3xl mx-auto px-6 pt-40 pb-24">
        <span className="telemetry telemetry-bright">Company</span>
        <h1 className="font-[family-name:var(--font-syne)] font-bold tracking-tight text-4xl sm:text-5xl mt-5 mb-6">
          Mission
        </h1>
        <p className="text-ink-dim text-lg font-light leading-relaxed max-w-xl">
          The operating system for Kazakhstan&apos;s environment.
        </p>

        {/* TODO: replace with real content — founding story, team, and the
            concrete goals/timeline behind each paragraph. */}
        <div className="mt-14 flex flex-col gap-8 max-w-xl">
          <p className="text-ink-dim leading-relaxed font-light">
            Kazakhstan carries some of the world&apos;s most consequential
            environmental stories — the Aral Sea, the Semipalatinsk Polygon,
            industrial corridors like Temirtau and Ekibastuz — yet the data
            describing them has lived scattered across agencies, formats and
            paywalls. Aetheris exists to close that gap: one living model of
            the country&apos;s air, water, industry and ecology that anyone
            can open.
          </p>
          <p className="text-ink-dim leading-relaxed font-light">
            We build for three audiences at once. Scientists get traceable
            indices and honest uncertainty. Cities get decision-grade risk
            signals. Citizens get a map that tells them, plainly, what they
            are breathing today — and a way to report what the sensors
            can&apos;t see.
          </p>
          <p className="text-ink-dim leading-relaxed font-light">
            Everything we publish aims to be verifiable: measured where a
            source exists, clearly labeled as modeled where one doesn&apos;t
            yet.
          </p>
        </div>
      </section>
      <Footer />
    </main>
  );
}
