"use client";

import type { ReactNode } from "react";
import { useNavCounts } from "@/hooks/useNavCounts";
import { Sidebar } from "@/components/layout/Sidebar";
import { MobileTabBar } from "@/components/layout/MobileTabBar";

export function AppShell({ children }: { children: ReactNode }) {
  const counts = useNavCounts();

  return (
    <div className="min-h-screen bg-base-200">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-[10px] focus:bg-base-100 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-primary"
      >
        Skip to content
      </a>
      <Sidebar counts={counts} />
      <main id="main-content" className="md:pl-[250px]">
        <div className="px-4 pb-24 pt-4 md:p-10">{children}</div>
      </main>
      <MobileTabBar counts={counts} />
    </div>
  );
}