"use client";

import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import { getSettings } from "@/lib/api";
import type { Settings } from "@/types";

/** Loads GET /settings on mount (only if `enabled`). `replace` swaps in the saved result after a PATCH. */
export function useSettings(enabled = true): {
  settings: Settings | null;
  loading: boolean;
  failed: boolean;
  retry: () => void;
  replace: Dispatch<SetStateAction<Settings | null>>;
} {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [failed, setFailed] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    getSettings()
      .then((data) => {
        if (cancelled) return;
        setSettings(data);
        setFailed(false);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [enabled, reloadKey]);

  const retry = () => {
    setLoading(true);
    setFailed(false);
    setReloadKey((key) => key + 1);
  };

  return { settings, loading, failed, retry, replace: setSettings };
}