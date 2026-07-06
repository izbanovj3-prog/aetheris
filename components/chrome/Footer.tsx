"use client";

import Link from "next/link";
import { SourceNote } from "@/components/ui/primitives";
import { networkStats } from "@/lib/data";
import { useDict } from "@/lib/useLocale";

export function Footer() {
  const dict = useDict();

  const columns = [
    {
      title: dict.footer.colPlatform,
      links: [
        { label: dict.footer.atlas, href: "/map" },
        { label: dict.footer.intelligence, href: "/dashboard" },
        { label: dict.footer.assistant, href: "/assistant" },
        { label: dict.footer.community, href: "/community" },
      ],
    },
    {
      title: dict.footer.colScience,
      links: [
        { label: dict.footer.methodology, href: "/methodology" },
        { label: dict.footer.dataSources, href: "/data-sources" },
        { label: dict.footer.sensorNetwork, href: "/sensor-network" },
      ],
    },
    {
      title: dict.footer.colCompany,
      links: [
        { label: dict.footer.mission, href: "/mission" },
        { label: dict.footer.press, href: "/press" },
        { label: dict.footer.contact, href: "/contact" },
      ],
    },
  ];

  return (
    <footer className="relative border-t border-line mt-32">
      <div className="max-w-6xl mx-auto px-6 py-16 grid grid-cols-2 md:grid-cols-5 gap-10">
        <div className="col-span-2 flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <span className="grid place-items-center w-8 h-8 rounded-lg border border-line-bright bg-carbon-2 font-[family-name:var(--font-syne)] font-bold text-sm">
              Æ
            </span>
            <span className="font-[family-name:var(--font-syne)] font-bold tracking-[0.28em] text-[13px]">
              AETHERIS
            </span>
          </div>
          <p className="text-ink-faint text-sm leading-relaxed max-w-xs font-light">
            {dict.footer.tagline}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <span className="dot-live" />
            <span className="telemetry">
              {dict.footer.stations(networkStats().cities)}
              <SourceNote
                source="Aetheris station registry · one station per monitored city, fed by Open-Meteo grid readings"
                className="ml-1.5"
              />
            </span>
          </div>
        </div>

        {columns.map((col) => (
          <div key={col.title} className="flex flex-col gap-3">
            <span className="telemetry telemetry-bright mb-1">{col.title}</span>
            {col.links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-sm text-ink-dim hover:text-emerald transition-colors duration-300 w-fit link-sweep"
              >
                {l.label}
              </Link>
            ))}
          </div>
        ))}
      </div>

      <div className="border-t border-line">
        <div className="max-w-6xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="telemetry">{dict.footer.bottomLeft}</span>
          <span className="telemetry">{dict.footer.bottomRight}</span>
        </div>
      </div>
    </footer>
  );
}
