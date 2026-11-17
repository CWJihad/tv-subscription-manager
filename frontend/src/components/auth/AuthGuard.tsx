"use client";

import { useEffect, useSyncExternalStore, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { TodayProvider } from "@/components/layout/TodayProvider";
import { hasSession, onSessionChanged } from "@/lib/session";


type SessionState = "unknown" | "in" | "out";

const getSnapshot = (): SessionState => (hasSession() ? "in" : "out");
const getServerSnapshot = (): SessionState => "unknown";
// instant

export function AuthGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  // Re-checks on login, logout, token refresh failure (this tab) and storage changes (other tabs).
  const state = useSyncExternalStore(onSessionChanged, getSnapshot, getServerSnapshot);

  useEffect(() => {
    if (state === "out") router.replace("/login");
  }, [state, router]);

  if (state !== "in") {
    return <div className="min-h-screen bg-neutral-25" aria-busy="true" />;
  }
  return <TodayProvider>{children}</TodayProvider>;
}