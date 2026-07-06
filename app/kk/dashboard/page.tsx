import type { Metadata } from "next";
import Dashboard from "@/components/dashboard/Dashboard";
import { Footer } from "@/components/chrome/Footer";
import { getDict, hreflangAlternates } from "@/lib/i18n";

const dict = getDict("kk");

export const metadata: Metadata = {
  title: dict.meta.dashboardTitle,
  description: dict.meta.dashboardDescription,
  alternates: {
    canonical: "/kk/dashboard/",
    languages: hreflangAlternates("/dashboard/"),
  },
};

export default function DashboardPageKk() {
  return (
    <main className="flex-1">
      <Dashboard />
      <Footer />
    </main>
  );
}
