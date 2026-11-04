import type { Metadata } from "next";
import { NotFoundScreen } from "@/components/chrome/ErrorScreens";

export const metadata: Metadata = {
  title: "Page not found · Страница не найдена · Бет табылмады",
  description: "There is no page at this address.",
  robots: { index: false },
};

export default function NotFound() {
  return <NotFoundScreen />;
}
