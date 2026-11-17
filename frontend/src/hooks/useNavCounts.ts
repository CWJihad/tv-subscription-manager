"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { getCustomerStats } from "@/lib/api";
import { onDataChanged } from "@/lib/api/events";
import type { NavCounts } from "@/lib/nav-counts";

const EMPTY_COUNTS: NavCounts = { expiring: 0, expired: 0 };

async function loadCounts(): Promise<NavCounts> {
  try {
    const stats = await getCustomerStats()
    return {expiring: stats.expiring, expired: stats.expired}
  } catch {
    return EMPTY_COUNTS;
  }
}

export function useNavCounts(): NavCounts {
  const pathname = usePathname();
  const [counts, setCounts] = useState<NavCounts>(EMPTY_COUNTS);

  // Refetch on route change. setState only runs inside the promise callback.
  useEffect(() => {
    let cancelled = false;
    void loadCounts().then((next) => {
      if (!cancelled) setCounts(next);
    });
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  // Refetch when /lib/api mutations emit "nigertoday:data-changed".
  useEffect(() => {
    let cancelled = false;
    const unsubscribe = onDataChanged(() => {
      void loadCounts().then((next) => {
        if (!cancelled) setCounts(next);
      });
    });
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  return counts;
}