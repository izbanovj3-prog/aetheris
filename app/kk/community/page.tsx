import type { Metadata } from "next";
import Community from "@/components/community/Community";
import { Footer } from "@/components/chrome/Footer";
import { getDict, hreflangAlternates } from "@/lib/i18n";

const dict = getDict("kk");

export const metadata: Metadata = {
  title: dict.meta.communityTitle,
  description: dict.meta.communityDescription,
  alternates: {
    canonical: "/kk/community/",
    languages: hreflangAlternates("/community/"),
  },
};

export default function CommunityPageKk() {
  return (
    <main className="flex-1">
      <Community />
      <Footer />
    </main>
  );
}
