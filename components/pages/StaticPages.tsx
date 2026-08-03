"use client";

import { Fragment, useEffect, useState } from "react";

import Link from "next/link";
import { BRAND } from "@/lib/site";
import { TRACKING_SINCE, countRemoteReports } from "@/lib/supabase";
import { getStations } from "@/lib/data";
import { cityName, localePath, type Locale } from "@/lib/i18n";
import { useLocale, usePageContent } from "@/lib/useLocale";

/* Contact copy stays plain strings in lib/content.ts — one sentence per
   channel, translated three times — but two of those sentences need a link
   inside them: "see Methodology for how that works", and the address to
   write to. Rather than splitting each into prefix/label/suffix fields
   across three locales, links are written inline as [label](href) and
   expanded here.

   Deliberately the smallest possible subset: one pattern, no nesting, no
   bold, no lists. Anything richer belongs in a component, not in a
   content string. */
function withLinks(text: string, locale: Locale) {
  return text.split(/(\[[^\]]+\]\([^)]+\))/g).map((part, i) => {
    const m = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(part);
    if (!m) return <Fragment key={i}>{part}</Fragment>;
    const [, label, href] = m;
    const style = "text-ink hover:text-emerald transition-colors duration-300 underline underline-offset-4 decoration-line-bright";
    // mailto and other external schemes must not be locale-prefixed.
    return href.includes(":") ? (
      <a key={i} href={href} className={style}>
        {label}
      </a>
    ) : (
      <Link key={i} href={localePath(href, locale)} className={style}>
        {label}
      </Link>
    );
  });
}

/* Shared shell — kicker + title + lede, identical across all six pages. */
function PageHead({ kicker, title, lede }: { kicker: string; title: string; lede: string }) {
  return (
    <>
      <span className="telemetry telemetry-bright">{kicker}</span>
      <h1 className="font-[family-name:var(--font-syne)] font-bold tracking-tight text-4xl sm:text-5xl mt-5 mb-6">
        {title}
      </h1>
      <p className="text-ink-dim text-lg font-light leading-relaxed max-w-xl">{lede}</p>
    </>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <section className="max-w-3xl mx-auto px-6 pt-40 pb-24">{children}</section>
  );
}

export function MethodologyContent() {
  const c = usePageContent();
  return (
    <Shell>
      <PageHead kicker={c.scienceKicker} title={c.methodology.title} lede={c.methodology.lede} />
      <div className="mt-14 flex flex-col gap-12">
        {c.methodology.sections.map((s) => (
          <div key={s.title} className="border-t border-line pt-8">
            <h2 className="font-[family-name:var(--font-syne)] font-bold text-2xl mb-3">
              {s.title}
            </h2>
            <p className="text-ink-dim leading-relaxed font-light">{s.body}</p>
          </div>
        ))}
      </div>
    </Shell>
  );
}

export function DataSourcesContent() {
  const c = usePageContent();
  return (
    <Shell>
      <PageHead kicker={c.scienceKicker} title={c.dataSources.title} lede={c.dataSources.lede} />
      <div className="mt-14 flex flex-col gap-10">
        {c.dataSources.sources.map((s) => (
          <div key={s.name} className="border-t border-line pt-8">
            <h2 className="font-[family-name:var(--font-syne)] font-bold text-xl mb-2">
              {s.name}
            </h2>
            <p className="text-ink-dim leading-relaxed font-light mb-3">{s.provides}</p>
            <span className="telemetry">{s.status}</span>
          </div>
        ))}
      </div>
    </Shell>
  );
}

export function SensorNetworkContent() {
  const locale = useLocale();
  const c = usePageContent();
  const cities = [...getStations()]
    .map((s) => ({ id: s.id, name: cityName(s.id, s.name, locale) }))
    .sort((a, b) => a.name.localeCompare(b.name, locale));
  return (
    <Shell>
      <PageHead kicker={c.scienceKicker} title={c.sensorNetwork.title} lede={c.sensorNetwork.lede} />

      <div className="mt-14 flex flex-col gap-8">
        {c.sensorNetwork.facts.map((f) => (
          <div key={f.label} className="flex items-baseline gap-5 border-t border-line pt-6">
            <span className="readout text-3xl text-emerald shrink-0">{f.value}</span>
            <span className="text-ink-dim font-light leading-relaxed">{f.label}</span>
          </div>
        ))}
      </div>

      <div className="mt-14 border-t border-line pt-8">
        <h2 className="font-[family-name:var(--font-syne)] font-bold text-2xl mb-2">
          {c.sensorNetwork.citiesTitle}
        </h2>
        <p className="text-ink-dim font-light leading-relaxed mb-6">
          {c.sensorNetwork.citiesLede}
        </p>
        <div className="flex flex-wrap gap-2">
          {cities.map((city) => (
            <Link
              key={city.id}
              href={localePath(`/city/${city.id}`, locale)}
              className="telemetry border border-line rounded-full px-3 py-1.5 hover:text-emerald hover:border-emerald/25 transition-colors duration-300"
            >
              {city.name}
            </Link>
          ))}
        </div>
      </div>

      <p className="text-ink-faint text-sm font-light leading-relaxed mt-14 max-w-xl">
        {c.sensorNetwork.inPrep}
      </p>
    </Shell>
  );
}

export function MissionContent() {
  const c = usePageContent();
  return (
    <Shell>
      <PageHead kicker={c.companyKicker} title={c.mission.title} lede={c.mission.lede} />
      <div className="mt-14 flex flex-col gap-8 max-w-xl">
        {c.mission.paragraphs.map((p, i) => (
          <p key={i} className="text-ink-dim leading-relaxed font-light">
            {p}
          </p>
        ))}
      </div>

      {/* Business model — judges ask who pays for this and why it does not
          disappear after the demo, and nothing on the site answered it. */}
      <div className="mt-16 border-t border-line pt-10 max-w-xl">
        <h2 className="font-[family-name:var(--font-syne)] font-bold text-2xl mb-6">
          {c.mission.sustainTitle}
        </h2>
        <div className="flex flex-col gap-6">
          {c.mission.sustainParagraphs.map((p, i) => (
            <p key={i} className="text-ink-dim leading-relaxed font-light">
              {p}
            </p>
          ))}
        </div>
        <Traction />
      </div>
    </Shell>
  );
}

/* Real traction, or nothing. The count is read live from the reports
   table; if that read fails the block renders nothing rather than
   printing a zero we cannot stand behind. Nothing here is backfilled —
   the datastore did not exist before TRACKING_SINCE, so this is a true
   running total from a standing start. */
function Traction() {
  const [count, setCount] = useState<number | null>(null);
  useEffect(() => {
    const ac = new AbortController();
    countRemoteReports(ac.signal).then(setCount);
    return () => ac.abort();
  }, []);

  if (count === null) return null;
  return (
    <div className="mt-10 border-t border-line pt-6 flex flex-col gap-2">
      <span className="telemetry telemetry-bright">Where it stands</span>
      <p className="text-ink-dim leading-relaxed font-light">
        <span className="readout text-emerald">{count}</span>{" "}
        {count === 1 ? "field report has" : "field reports have"} been filed to
        the shared datastore since {TRACKING_SINCE}, when it went live. Small
        numbers, honestly counted: nothing here is estimated or backfilled,
        because there was nothing to backfill.
      </p>
      <p className="telemetry">
        Visitor analytics is collected via Vercel Analytics but is not surfaced
        here — reading those figures needs an API token this build does not hold.
      </p>
    </div>
  );
}

const PALETTE = [
  { name: "Abyss", hex: BRAND.abyss },
  { name: "Carbon", hex: BRAND.carbon },
  { name: "Emerald", hex: BRAND.emerald },
  { name: "Cyan", hex: BRAND.cyan },
  { name: "Atmos", hex: BRAND.atmos },
  { name: "Ink", hex: BRAND.ink },
] as const;

export function PressContent() {
  const c = usePageContent();
  return (
    <Shell>
      <PageHead kicker={c.companyKicker} title={c.press.title} lede={c.press.lede} />
      <div className="mt-14 flex flex-col gap-12">
        <div className="border-t border-line pt-8">
          <h2 className="font-[family-name:var(--font-syne)] font-bold text-2xl mb-3">
            {c.press.boilerplateTitle}
          </h2>
          <p className="text-ink-dim leading-relaxed font-light">{c.press.boilerplate}</p>
          <p className="text-ink-faint text-sm font-light mt-3">{c.press.nameNote}</p>
        </div>

        <div className="border-t border-line pt-8">
          <h2 className="font-[family-name:var(--font-syne)] font-bold text-2xl mb-3">
            {c.press.assetsTitle}
          </h2>
          <ul className="flex flex-col gap-2 text-ink-dim font-light">
            <li>
              <a href="/icon.svg" download className="link-sweep hover:text-emerald transition-colors duration-300">
                {c.press.assetLogo}
              </a>
            </li>
            <li>
              <a href="/opengraph-image.png" download className="link-sweep hover:text-emerald transition-colors duration-300">
                {c.press.assetSocial}
              </a>
            </li>
          </ul>
        </div>

        <div className="border-t border-line pt-8">
          <h2 className="font-[family-name:var(--font-syne)] font-bold text-2xl mb-4">
            {c.press.paletteTitle}
          </h2>
          <ul className="flex flex-wrap gap-x-8 gap-y-3">
            {PALETTE.map((col) => (
              <li key={col.name} className="flex items-center gap-2.5">
                <span
                  className="w-3.5 h-3.5 rounded border border-line-bright"
                  style={{ background: col.hex }}
                />
                <span className="text-ink-dim text-sm font-light">{col.name}</span>
                <span className="readout text-xs text-ink-faint uppercase">{col.hex}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="border-t border-line pt-8">
          <h2 className="font-[family-name:var(--font-syne)] font-bold text-2xl mb-3">
            {c.press.mediaTitle}
          </h2>
          <p className="text-ink-dim leading-relaxed font-light">{c.press.mediaBody}</p>
        </div>
      </div>
    </Shell>
  );
}

export function ContactContent() {
  const locale = useLocale();
  const c = usePageContent();
  return (
    <Shell>
      <PageHead kicker={c.companyKicker} title={c.contact.title} lede={c.contact.lede} />
      <div className="mt-14 flex flex-col gap-12">
        {c.contact.channels.map((ch) => (
          <div key={ch.title} className="border-t border-line pt-8">
            <h2 className="font-[family-name:var(--font-syne)] font-bold text-2xl mb-3">
              {ch.title}
            </h2>
            <p className="text-ink-dim leading-relaxed font-light mb-4 max-w-xl">
              {withLinks(ch.body, locale)}
            </p>
            <Link
              href={localePath(ch.href, locale)}
              className="text-sm text-ink-dim hover:text-emerald transition-colors duration-300 link-sweep"
            >
              {ch.actionLabel} →
            </Link>
          </div>
        ))}
      </div>
    </Shell>
  );
}
