import type { Metadata } from "next";
import Community from "@/components/community/Community";
import { Footer } from "@/components/chrome/Footer";

export const metadata: Metadata = {
  title: "Community",
  description:
    "Field reports from across Kazakhstan, corroborated between independent contributors — with Eco-Points, geographic badges and local eco-events.",
  alternates: { canonical: "/community/" },
};

export default function CommunityPage() {
  return (
    <main className="flex-1">
      <Community />
      <Footer />
    </main>
  );
}
