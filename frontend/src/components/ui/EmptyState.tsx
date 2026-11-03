import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { toneClasses } from "@/lib/tones";
import { cn } from "@/lib/cn";

export interface EmptyStateProps {
  icon: LucideIcon;
  tone?: "primary" | "success";
  title: string;
  text: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon: Icon, tone = "primary", title, text, action, className }: EmptyStateProps) {
  const t = toneClasses[tone];
  return (
    <div className={cn("flex flex-col items-center px-6 py-16 text-center", className)}>
      <span className={cn("inline-flex size-16 items-center justify-center rounded-full", t.soft, t.strong)}>
        <Icon className="size-7" aria-hidden="true" />
      </span>
      <h3 className="mt-5 text-lg font-semibold leading-[26px] text-neutral-900">{title}</h3>
      <p className="mt-1 max-w-sm text-sm leading-[22px] text-neutral-500">{text}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}