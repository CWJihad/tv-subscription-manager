"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { loadToday } from "@/lib/today";

type LoadState = "loading" | "ready" | "error";

/** Loads "today" from GET /meta once, then renders the app. getToday() is safe below this. */
export function TodayProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<LoadState>("loading");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    loadToday()
      .then(() => {
        if (!cancelled) setState("ready");
      })
      .catch(() => {
        if (!cancelled) setState("error");
      });
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  function retry() {
    setState("loading");
    setAttempt((count) => count + 1);
  }

  if (state === "ready") return <>{children}</>;

  if (state === "error") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-neutral-25 px-4 text-center">
        <p role="alert" className="text-base leading-6 text-neutral-700">
          Could not reach the server. Check your connection and try again.
        </p>
        <Button onClick={retry}>Try again</Button>
      </div>
    );
  }

  return <div className="min-h-screen bg-neutral-25" aria-busy="true" />;
}