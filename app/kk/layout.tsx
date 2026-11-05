import type { Metadata } from "next";
import { RootDocument, rootMetadata } from "@/components/chrome/RootDocument";

/* Root layout of the kk tree: the prerendered HTML says lang="kk". */
export const metadata: Metadata = rootMetadata("kk");
export { viewport } from "@/components/chrome/RootDocument";

export default function Layout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <RootDocument lang="kk">{children}</RootDocument>;
}
