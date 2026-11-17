"use client";

import { useEffect, useState } from "react";
import { getMeta } from "@/lib/api";

/** Business time zone from GET /meta (for example "Asia/Dhaka"). null until loaded or if it fails. */
export function useTimezone(): string | null {
  const [timezone, setTimezone] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getMeta()
      .then((meta) => {
        if (!cancelled) setTimezone(meta.timezone);
      })
      .catch(() => {
        /* the time zone text is optional */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return timezone;
}