import type { Metadata } from "next";
import { RootDocument, rootMetadata } from "@/components/chrome/RootDocument";

/* Root layout of the en tree: the prerendered HTML says lang="en". */
export const metadata: Metadata = rootMetadata("en");
export { viewport } from "@/components/chrome/RootDocument";

export default function Layout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <RootDocument lang="en">{children}</RootDocument>;
}
