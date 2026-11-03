import type { LucideIcon } from "lucide-react";
import { toneClasses, type Tone } from "@/lib/tones";
import { cn } from "@/lib/cn";

export interface StatCardProps {
  label: string;
  value: number | string;
  caption: string;
  icon: LucideIcon;
  tone?: Extract<Tone, "neutral" | "success" | "warning" | "danger">;
  loading?: boolean;
  className?: string;
}

export function StatCard({ label, value, caption, icon: Icon, tone = "neutral", loading = false, className }: StatCardProps) {
  const t = toneClasses[tone];

  if (loading) {
    return (
      <div className={cn("rounded-2xl border border-neutral-200 bg-neutral-0 p-5 sm:p-6", className)} aria-busy="true">
        <div className="skeleton h-8 w-32" />
        <div className="skeleton mt-4 h-11 w-20" />
        <div className="skeleton mt-3 h-4 w-28" />
      </div>
    );
  }

  return (
    <div className={cn("rounded-2xl border border-neutral-200 bg-neutral-0 p-5 sm:p-6", className)}>
      <div className="flex items-center gap-3">
        <span className={cn("inline-flex size-8 items-center justify-center rounded-lg", t.soft, t.strong)}>
          <Icon className="size-[18px]" aria-hidden="true" />
        </span>
        <span className="text-sm font-medium leading-[22px] text-neutral-500">{label}</span>
      </div>
      <p className={cn("mt-4 text-[36px] font-bold leading-[44px]", t.strong)}>{value}</p>
      <p className="mt-1 text-xs leading-[18px] text-neutral-500">{caption}</p>
    </div>
  );
}