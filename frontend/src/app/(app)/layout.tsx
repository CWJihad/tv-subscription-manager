import { Suspense, type ReactNode } from "react";
import { AppShell } from "@/components/layout/AppShell";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-neutral-25" aria-busy="true" />}>
      <AppShell>{children}</AppShell>
    </Suspense>
  );
}