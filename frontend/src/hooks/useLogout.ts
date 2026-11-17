"use client";

import { useRouter } from "next/navigation";
import { logout } from "@/lib/api";

export function useLogout(): () => void {
  const router = useRouter();
  return async () => {
    await logout()
    router.replace("/login");
  };
}