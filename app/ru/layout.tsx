import type { Metadata } from "next";
import { RootDocument, rootMetadata } from "@/components/chrome/RootDocument";

/* Root layout of the ru tree: the prerendered HTML says lang="ru". */
export const metadata: Metadata = rootMetadata("ru");
export { viewport } from "@/components/chrome/RootDocument";

export default function Layout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <RootDocument lang="ru">{children}</RootDocument>;
}
