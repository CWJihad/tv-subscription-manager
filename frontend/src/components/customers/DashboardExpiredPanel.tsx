"use client";

import Link from "next/link";
import { ArrowRight, CircleCheck, Search } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { getExpiredAgoLabel } from "@/lib/format";
import type { CustomerWithStatus } from "@/types";

const MAX_ROWS = 5;

export interface DashboardExpiredPanelProps {
  customers: CustomerWithStatus[];
  loading?: boolean;
  hasQuery?: boolean;
  onOpen: (customer: CustomerWithStatus) => void;
  onMessage: (customer: CustomerWithStatus) => void;
}

export function DashboardExpiredPanel({
  customers,
  loading = false,
  hasQuery = false,
  onOpen,
  onMessage,
}: DashboardExpiredPanelProps) {
  const rows = customers.slice(0, MAX_ROWS);

  return (
    <section
      aria-labelledby="dashboard-expired-title"
      className="flex flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-0"
    >
      <div className="px-6 pb-4 pt-6">
        <h2
          id="dashboard-expired-title"
          className="text-[22px] font-semibold leading-[30px] text-neutral-900"
        >
          Recently Expired
        </h2>
        <p className="text-xs leading-[18px] text-neutral-500">Renew or follow up</p>
      </div>

      <div className="flex-1">
        {loading ? (
          <div className="space-y-3 px-6 pb-4" aria-busy="true">
            <div className="skeleton h-12 w-full" />
            <div className="skeleton h-12 w-full" />
          </div>
        ) : rows.length === 0 ? (
          hasQuery ? (
            <EmptyState
              icon={Search}
            //   tone="neutral"
              title="No matches"
              text="No expired customer matches your search."
            />
          ) : (
            <EmptyState
              icon={CircleCheck}
              tone="success"
              title="No expired subscriptions"
              text="Every customer subscription is still active."
            />
          )
        ) : (
          <ul className="divide-y divide-neutral-200 border-t border-neutral-200">
            {rows.map((customer) => (
              <li
                key={customer.id}
                className="flex items-center gap-3 px-6 py-4 hover:bg-neutral-25"
              >
                <button
                  type="button"
                  onClick={() => onOpen(customer)}
                  className="flex min-w-0 flex-1 items-center gap-3 rounded-lg text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500"
                >
                  <Avatar name={customer.fullName} />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium leading-[22px] text-neutral-900">
                      {customer.fullName}
                    </span>
                    <span className="block text-xs leading-[18px] text-danger-700">
                      Expired {getExpiredAgoLabel(customer.daysLeft)}
                    </span>
                  </span>
                </button>
                <Button variant="outline" onClick={() => onMessage(customer)}>
                  Message
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="border-t border-neutral-200 px-6 py-4">
        <Link
          href="/expired"
          className="inline-flex items-center gap-1 text-sm font-semibold text-primary-600 hover:text-primary-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500"
        >
          View all expired
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}