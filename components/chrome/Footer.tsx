import Link from "next/link";
import { SourceNote } from "@/components/ui/primitives";
import { networkStats } from "@/lib/data";

const COLUMNS = [
  {
    title: "Platform",
    links: [
      { label: "Global Atlas", href: "/map" },
      { label: "Intelligence", href: "/dashboard" },
      { label: "AI Assistant", href: "/assistant" },
      { label: "Community", href: "/community" },
    ],
  },
  {
    title: "Science",
    links: [
      { label: "Methodology", href: "/methodology" },
      { label: "Data sources", href: "/data-sources" },
      { label: "Sensor network", href: "/sensor-network" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "Mission", href: "/mission" },
      { label: "Press kit", href: "/press" },
      { label: "Contact", href: "/contact" },
    ],
  },
];

export function Footer() {
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
            Kazakhstan&apos;s environmental intelligence, in one living system.
            Built for scientists, cities, and citizens.
          </p>
          <div className="flex items-center gap-2 mt-2">
            <span className="dot-live" />
            <span className="telemetry">
              {networkStats().cities} city stations reporting
              <SourceNote
                source="Aetheris station registry · one station per monitored city, fed by Open-Meteo grid readings"
                className="ml-1.5"
              />
            </span>
          </div>
        </div>

        {COLUMNS.map((col) => (
          <div key={col.title} className="flex flex-col gap-3">
            <span className="telemetry telemetry-bright mb-1">{col.title}</span>
            {col.links.map((l) => (
              <Link
                key={l.label}
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
          <span className="telemetry">
            © 2026 Aetheris Systems · Kazakhstan environmental intelligence
          </span>
          <span className="telemetry">
            51.17°N 71.43°E · Astana uplink nominal
          </span>
        </div>
      </div>
    </footer>
  );
}
