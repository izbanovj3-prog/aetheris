import Link from "next/link";
import { Fragment } from "react";
import { getLegal, type LegalDoc } from "@/lib/legal";
import { localePath, type Locale } from "@/lib/i18n";

/* Privacy policy and terms of use. A server component: the text is static
   and must read the same with JavaScript off. The draft banner sits above
   the title on purpose — it is the first thing anyone reads. */

const linkStyle =
  "text-ink hover:text-emerald transition-colors duration-300 underline underline-offset-4 decoration-line-bright";

function withLinks(text: string, locale: Locale) {
  return text.split(/(\[[^\]]+\]\([^)]+\))/g).map((part, i) => {
    const m = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(part);
    if (!m) return <Fragment key={i}>{part}</Fragment>;
    const [, label, href] = m;
    return href.includes(":") ? (
      <a key={i} href={href} className={linkStyle}>
        {label}
      </a>
    ) : (
      <Link key={i} href={localePath(href, locale)} className={linkStyle}>
        {label}
      </Link>
    );
  });
}

function Body({ paragraphs, locale }: { paragraphs: string[]; locale: Locale }) {
  // Consecutive "• " paragraphs render as one list.
  const blocks: Array<{ list: boolean; items: string[] }> = [];
  for (const p of paragraphs) {
    const list = p.startsWith("• ");
    const last = blocks[blocks.length - 1];
    if (list && last?.list) last.items.push(p.slice(2));
    else blocks.push({ list, items: [list ? p.slice(2) : p] });
  }
  return (
    <>
      {blocks.map((b, i) =>
        b.list ? (
          <ul key={i} className="list-disc pl-6 flex flex-col gap-1.5 text-ink-dim leading-relaxed font-light">
            {b.items.map((t) => (
              <li key={t}>{withLinks(t, locale)}</li>
            ))}
          </ul>
        ) : (
          <p key={i} className="text-ink-dim leading-relaxed font-light">
            {withLinks(b.items[0], locale)}
          </p>
        ),
      )}
    </>
  );
}

export function LegalPage({ locale, doc }: { locale: Locale; doc: "privacy" | "terms" }) {
  const d: LegalDoc = getLegal(locale)[doc];
  return (
    <section className="max-w-3xl mx-auto px-6 pt-40 pb-24">
      <div
        role="note"
        className="rounded-xl border-2 border-amber-400/70 bg-amber-400/10 px-5 py-4 mb-10 text-ink leading-relaxed"
      >
        <strong className="font-semibold">⚠ {d.draftBanner}</strong>
      </div>
      <span className="telemetry telemetry-bright">{d.kicker}</span>
      <h1 className="font-[family-name:var(--font-syne)] font-bold tracking-tight text-4xl sm:text-5xl mt-5 mb-4 break-words">
        {d.title}
      </h1>
      <p className="telemetry">{d.updated}</p>
      <div className="mt-12 flex flex-col gap-10">
        {d.sections.map((s) => (
          <div key={s.heading} className="border-t border-line pt-7 flex flex-col gap-3">
            <h2 className="font-[family-name:var(--font-syne)] font-bold text-2xl break-words">{s.heading}</h2>
            <Body paragraphs={s.body} locale={locale} />
          </div>
        ))}
      </div>
    </section>
  );
}
