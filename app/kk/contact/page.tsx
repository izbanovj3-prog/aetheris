import type { Metadata } from "next";
import { Footer } from "@/components/chrome/Footer";
import { ContactContent } from "@/components/pages/StaticPages";
import { getPageContent } from "@/lib/content";
import { hreflangAlternates } from "@/lib/i18n";

const c = getPageContent("kk");

export const metadata: Metadata = {
  title: c.contact.metaTitle,
  description: c.contact.metaDescription,
  alternates: {
    canonical: "/kk/contact/",
    languages: hreflangAlternates("/contact/"),
  },
};

export default function ContactPageKk() {
  return (
    <main className="flex-1">
      <ContactContent />
      <Footer />
    </main>
  );
}
