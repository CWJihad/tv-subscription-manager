"use client";

import { CircleCheck, Search } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { DataTable, type DataTableColumn } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatTableDate, getRemainingLabel } from "@/lib/format";
import type { CustomerWithStatus } from "@/types";

export interface DashboardExpiringPanelProps {
  customers: CustomerWithStatus[];
  today: string;
  loading?: boolean;
  hasQuery?: boolean;
  onOpen: (customer: CustomerWithStatus) => void;
  onSendReminder: (customer: CustomerWithStatus) => void;
}

export function DashboardExpiringPanel({
  customers,
  today,
  loading = false,
  hasQuery = false,
  onOpen,
  onSendReminder,
}: DashboardExpiringPanelProps) {
  const columns: DataTableColumn<CustomerWithStatus>[] = [
    {
      key: "customer",
      header: "CUSTOMER",
      cell: (row) => (
        <div className="flex items-center gap-3">
          <Avatar name={row.fullName} />
          <span className="text-sm font-medium leading-[22px] text-neutral-900">
            {row.fullName}
          </span>
        </div>
      ),
    },
    {
      key: "expires",
      header: "EXPIRES",
      cell: (row) => (
        <span className="text-sm leading-[22px] text-neutral-700">
          {formatTableDate(row.expiryDate, today)}
        </span>
      ),
    },
    {
      key: "remaining",
      header: "REMAINING",
      cell: (row) => (
        <StatusBadge status={row.status} label={getRemainingLabel(row.daysLeft)} />
      ),
    },
    {
      key: "action",
      header: "ACTION",
      cell: (row) => (
        <Button
          variant="soft"
          onClick={(event) => {
            event.stopPropagation();
            onSendReminder(row);
          }}
        >
          Send Reminder
        </Button>
      ),
    },
  ];

  const emptyState = hasQuery ? (
    <EmptyState
      icon={Search}
    //   tone="neutral"
      title="No matches"
      text="No expiring customer matches your search."
    />
  ) : (
    <EmptyState
      icon={CircleCheck}
      tone="success"
      title="You are all caught up"
      text="No subscriptions expire in the next 10 days. Check back soon."
    />
  );

  return (
    <section
      aria-labelledby="dashboard-expiring-title"
      className="overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-0"
    >
      <div className="px-6 pb-4 pt-6">
        <h2
          id="dashboard-expiring-title"
          className="text-[22px] font-semibold leading-[30px] text-neutral-900"
        >
          Expiring Soon
        </h2>
        <p className="text-xs leading-[18px] text-neutral-500">Sorted by days left</p>
      </div>
      <DataTable
        columns={columns}
        rows={customers}
        getRowKey={(row) => row.id}
        ariaLabel="Customers expiring soon"
        onRowClick={onOpen}
        loading={loading}
        emptyState={emptyState}
      />
    </section>
  );
}