import { getPaymentBadge } from "@/lib/payment";
import { cn } from "@/lib/cn";
import { toneClasses } from "@/lib/tones";
import type { Payment } from "@/types";

interface PaymentBadgeProps {
  payment: Payment | null;
  className?: string;
}

export function PaymentBadge({ payment, className }: PaymentBadgeProps) {
  const { label, tone } = getPaymentBadge(payment);
  const classes = toneClasses[tone];
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center rounded-full px-2.5 text-sm font-semibold leading-5",
        classes.soft,
        classes.badgeText,
        className,
      )}
    >
      {label}
    </span>
  );
}