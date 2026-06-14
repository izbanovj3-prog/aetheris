import type { Metadata } from "next";
import Community from "@/components/community/Community";
import { Footer } from "@/components/chrome/Footer";

export const metadata: Metadata = {
  title: "Community",
  description:
    "Field reports, eco missions, and the people verifying the planet's data.",
};

export default function CommunityPage() {
  return (
    <main className="flex-1">
      <Community />
      <Footer />
    </main>
  );
}
