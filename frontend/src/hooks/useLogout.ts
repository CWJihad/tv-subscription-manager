"use client";

import { useRouter } from "next/navigation";
import { clearSession } from "@/lib/session";

export function useLogout(): () => void {
  const router = useRouter();
  return () => {
    clearSession();
    router.replace("/login");
  };
}