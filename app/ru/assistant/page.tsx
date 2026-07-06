import type { Metadata } from "next";
import { Suspense } from "react";
import AssistantChat from "@/components/assistant/AssistantChat";
import { getDict, hreflangAlternates } from "@/lib/i18n";

const dict = getDict("ru");

export const metadata: Metadata = {
  title: dict.meta.assistantTitle,
  description: dict.meta.assistantDescription,
  alternates: {
    canonical: "/ru/assistant/",
    languages: hreflangAlternates("/assistant/"),
  },
};

export default function AssistantPageRu() {
  return (
    <main className="flex-1">
      <Suspense
        fallback={
          <div className="h-[100svh] grid place-items-center">
            <span className="telemetry animate-[blink_2.2s_steps(2,start)_infinite]">
              {dict.assistant.emptyTitle}
            </span>
          </div>
        }
      >
        <AssistantChat />
      </Suspense>
    </main>
  );
}
