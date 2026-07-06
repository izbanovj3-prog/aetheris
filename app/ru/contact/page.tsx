import type { Metadata } from "next";
import { Footer } from "@/components/chrome/Footer";
import { ContactContent } from "@/components/pages/StaticPages";
import { getPageContent } from "@/lib/content";
import { hreflangAlternates } from "@/lib/i18n";

const c = getPageContent("ru");

export const metadata: Metadata = {
  title: c.contact.metaTitle,
  description: c.contact.metaDescription,
  alternates: {
    canonical: "/ru/contact/",
    languages: hreflangAlternates("/contact/"),
  },
};

export default function ContactPageRu() {
  return (
    <main className="flex-1">
      <ContactContent />
      <Footer />
    </main>
  );
}
