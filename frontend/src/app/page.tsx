'use client'
import { hasSession } from "@/lib/session";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
    const router = useRouter()
    useEffect(() => {
        hasSession() ? router.replace('/dashboard') : router.replace('/login')
      }, [router]);
}