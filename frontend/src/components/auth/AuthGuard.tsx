"use client";

import { useEffect, useSyncExternalStore, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { hasSession } from "@/lib/session";

type SessionState = "unknown" | "in" | "out";

function subscribe(callback: () => void): () => void {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

const getSnapshot = (): SessionState => (hasSession() ? "in" : "out");
const getServerSnapshot = (): SessionState => "unknown";

export function AuthGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    if (state === "out") router.replace("/login");
  }, [state, router]);

  if (state === "out") {
    return <div className="min-h-screen bg-neutral-25" aria-busy="true" />;
  }
  return <>{children}</>;
}