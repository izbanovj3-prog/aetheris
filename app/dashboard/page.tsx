import type { Metadata } from "next";
import Dashboard from "@/components/dashboard/Dashboard";
import { Footer } from "@/components/chrome/Footer";

export const metadata: Metadata = {
  title: "Intelligence",
  description: "Real-time planetary analytics and AI environmental insights.",
  alternates: { canonical: "/dashboard/" },
};

export default function DashboardPage() {
  return (
    <main className="flex-1">
      <Dashboard />
      <Footer />
    </main>
  );
}
