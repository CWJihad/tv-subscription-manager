import type { ReactNode } from "react";
import { TriangleAlert } from "lucide-react";
import { toneClasses } from "@/lib/tones";
import { cn } from "@/lib/cn";

export interface AlertBannerProps {
  title: string;
  children?: ReactNode;
  action?: ReactNode;
  tone?: "warning" | "danger" | "success";
  className?: string;
}

export function AlertBanner({ title, children, action, tone = "warning", className }: AlertBannerProps) {
  const t = toneClasses[tone];
  return (
    <div
      role="status"
      className={cn(
        "flex flex-col gap-4 rounded-2xl border p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5",
        t.soft,
        t.softBorder,
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <TriangleAlert className={cn("mt-0.5 size-5 shrink-0", t.strong)} aria-hidden="true" />
        <p className={cn("text-sm leading-[22px]", t.badgeText)}>
          <span className="font-semibold">{title}</span>
          {children && <> {children}</>}
        </p>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}