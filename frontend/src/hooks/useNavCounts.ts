"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { getCustomers } from "@/lib/api";
import { onDataChanged } from "@/lib/api/events";
import { getNavCounts, type NavCounts } from "@/lib/nav-counts";
import { getToday } from "@/lib/today";

const EMPTY_COUNTS: NavCounts = { expiring: 0, expired: 0 };

async function loadCounts(): Promise<NavCounts> {
  try {
    const customers = await getCustomers();
    return getNavCounts(customers, getToday());
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