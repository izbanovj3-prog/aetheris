import type { Metadata } from "next";
import { Suspense } from "react";
import AssistantChat from "@/components/assistant/AssistantChat";

export const metadata: Metadata = {
  title: "AI Assistant",
  description: "Converse with the Aetheris environmental analyst.",
};

export default function AssistantPage() {
  return (
    <main className="flex-1">
      <Suspense
        fallback={
          <div className="h-[100svh] grid place-items-center">
            <span className="telemetry animate-[blink_2.2s_steps(2,start)_infinite]">
              Waking the analyst
            </span>
          </div>
        }
      >
        <AssistantChat />
      </Suspense>
    </main>
  );
}
