import type { SubscriptionStatus } from "@/types";
import { toneClasses, type StatusTone } from "@/lib/tones";
import { cn } from "@/lib/cn";

const statusTone: Record<SubscriptionStatus, StatusTone> = {
  active: "success",
  expiring: "warning",
  expired: "danger",
};

export interface StatusBadgeProps {
  status: SubscriptionStatus;
  label: string;
  className?: string;
}

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  const t = toneClasses[statusTone[status]];
  return (
    <span
      className={cn(
        "inline-flex h-[26px] items-center gap-2 whitespace-nowrap rounded-full px-3 text-sm font-semibold leading-5",
        t.soft,
        t.badgeText,
        className,
      )}
    >
      <span className={cn("size-2 rounded-full", t.dot)} aria-hidden="true" />
      {label}
    </span>
  );
}