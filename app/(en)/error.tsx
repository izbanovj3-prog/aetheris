"use client";

import { useEffect } from "react";
import { ErrorScreen } from "@/components/chrome/ErrorScreens";

/* Route-level error boundary — keeps the global chrome (Nav/atmosphere)
   and offers recovery. Next 16 passes `unstable_retry`, not `reset`. */
export default function Error({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      console.error(error);
    }
  }, [error]);

  return <ErrorScreen onRetry={() => unstable_retry()} />;
}
