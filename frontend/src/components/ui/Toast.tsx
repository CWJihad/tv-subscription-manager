"use client";

import { useEffect } from "react";
import { CircleCheck, TriangleAlert, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { toneClasses } from "@/lib/tones";
import { cn } from "@/lib/cn";

export type ToastType = "success" | "error";

export interface ToastData {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

export interface ToastProps extends ToastData {
  onDismiss: (id: string) => void;
}

export function Toast({ id, type, title, message, duration = 4000, onDismiss }: ToastProps) {
  useEffect(() => {
    const timer = window.setTimeout(() => onDismiss(id), duration);
    return () => window.clearTimeout(timer);
  }, [id, duration, onDismiss]);

  const tone = toneClasses[type === "success" ? "success" : "danger"];
  const Icon = type === "success" ? CircleCheck : TriangleAlert;

  return (
    <div
      role={type === "error" ? "alert" : "status"}
      className={cn("flex items-start gap-3 rounded-xl border bg-neutral-0 p-4 shadow-lg", tone.border)}
    >
      <Icon className={cn("mt-0.5 size-5 shrink-0", tone.strong)} aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold leading-5 text-neutral-900">{title}</p>
        {message && <p className="mt-0.5 text-xs leading-[18px] text-neutral-500">{message}</p>}
      </div>
      <Button variant="ghost" size="sm" iconOnly aria-label="Dismiss notification" onClick={() => onDismiss(id)} className="-mr-2 -mt-2 !h-8 !w-8">
        <X className="size-4" aria-hidden="true" />
      </Button>
    </div>
  );
}