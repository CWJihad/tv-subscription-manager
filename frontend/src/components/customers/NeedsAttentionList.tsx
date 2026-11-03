import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/lib/cn";
import { getExpiredAgoLabel, getRemainingLabel } from "@/lib/format";
import type { CustomerWithStatus } from "@/types";

const MAX_ROWS = 5;

export interface NeedsAttentionListProps {
  customers: CustomerWithStatus[];
  className?: string;
}

export function NeedsAttentionList({ customers, className }: NeedsAttentionListProps) {
  const rows = customers.slice(0, MAX_ROWS);

  return (
    <section aria-labelledby="needs-attention-title" className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between">
        <h2
          id="needs-attention-title"
          className="text-[18px] font-semibold leading-[26px] text-neutral-900"
        >
          Needs your attention
        </h2>
        <Link
          href="/customers"
          className="text-sm font-semibold text-primary-600 hover:text-primary-700"
        >
          See all
        </Link>
      </div>

      <ul className="divide-y divide-neutral-200 overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-0">
        {rows.map((customer) => {
          const expired = customer.status === "expired";
          return (
            <li key={customer.id}>
              <Link
                href={`/customers/${customer.id}`}
                className="flex min-h-14 items-center gap-3 px-4 py-3 active:bg-neutral-25"
              >
                <Avatar name={customer.fullName} />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium leading-[22px] text-neutral-900">
                    {customer.fullName}
                  </span>
                  <span
                    className={cn(
                      "block text-xs leading-[18px]",
                      expired ? "text-danger-700" : "text-warning-700",
                    )}
                  >
                    {expired
                      ? `Expired ${getExpiredAgoLabel(customer.daysLeft)}`
                      : getRemainingLabel(customer.daysLeft)}
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}