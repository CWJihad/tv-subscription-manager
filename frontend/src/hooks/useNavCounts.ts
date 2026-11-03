"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { getCustomers } from "@/lib/api";
import { onDataChanged } from "@/lib/api/events";
import { getNavCounts, type NavCounts } from "@/lib/nav-counts";
import { getToday } from "@/lib/today";

const EMPTY_COUNTS: NavCounts = { expiring: 0, expired: 0 };

export function useNavCounts(): NavCounts {
  const pathname = usePathname();
  const [counts, setCounts] = useState<NavCounts>(EMPTY_COUNTS);

  const refresh = useCallback(async () => {
    try {
      const customers = await getCustomers();
      setCounts(getNavCounts(customers, getToday()));
    } catch {
      setCounts(EMPTY_COUNTS);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh, pathname]);

  useEffect(
    () =>
      onDataChanged(() => {
        void refresh();
      }),
    [refresh],
  );

  return counts;
}