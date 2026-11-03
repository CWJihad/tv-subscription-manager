"use client";

import Link from "next/link";
import { CircleCheck, MessageCircle, Search } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { DataTable, type DataTableColumn } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatTableDate, getRemainingLabel } from "@/lib/format";
import type { CustomerWithStatus } from "@/types";

export interface ExpiringTableProps {
  customers: CustomerWithStatus[];
  today: string;
  loading?: boolean;
  /** True when no customer is expiring at all (not just no matches). */
  isEmptyList?: boolean;
  onOpen: (customer: CustomerWithStatus) => void;
  onSendReminder: (customer: CustomerWithStatus) => void;
  onRenew: (customer: CustomerWithStatus) => void;
}

export function ExpiringTable({
  customers,
  today,
  loading = false,
  isEmptyList = false,
  onOpen,
  onSendReminder,
  onRenew,
}: ExpiringTableProps) {
  const columns: DataTableColumn<CustomerWithStatus>[] = [
    {
      key: "customer",
      header: "CUSTOMER",
      cell: (row) => (
        <div className="flex items-center gap-3">
          <Avatar name={row.fullName} />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium leading-[22px] text-neutral-900">
              {row.fullName}
            </p>
            <p className="truncate text-xs leading-[18px] text-neutral-500">{row.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: "phone",
      header: "PHONE",
      cell: (row) => (
        <span className="whitespace-nowrap text-sm leading-[22px] text-neutral-700">
          {row.phone}
        </span>
      ),
    },
    {
      key: "expires",
      header: "EXPIRES",
      cell: (row) => (
        <span className="whitespace-nowrap text-sm leading-[22px] text-neutral-700">
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
      key: "actions",
      header: "ACTIONS",
      cell: (row) => (
        <div className="flex items-center gap-2">
          <Button
            variant="soft"
            leftIcon={<MessageCircle className="size-4" aria-hidden="true" />}
            onClick={(event) => {
              event.stopPropagation();
              onSendReminder(row);
            }}
          >
            Send Reminder
          </Button>
          <Button
            variant="outline"
            onClick={(event) => {
              event.stopPropagation();
              onRenew(row);
            }}
          >
            Renew
          </Button>
        </div>
      ),
    },
  ];

  const emptyState = isEmptyList ? (
    <EmptyState
      icon={CircleCheck}
      tone="success"
      title="You are all caught up"
      text="No subscriptions expire in the next 10 days. Check back soon."
    />
  ) : (
    <EmptyState
      icon={Search}
    //   tone="neutral"
      title="No matches"
      text="No expiring customer matches your search or filter."
    />
  );

  return (
    <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-0">
      <DataTable
        columns={columns}
        rows={customers}
        getRowKey={(row) => row.id}
        ariaLabel="Customers expiring soon"
        onRowClick={onOpen}
        loading={loading}
        emptyState={emptyState}
        renderMobileCard={(row: CustomerWithStatus) => (
          <Link
            href={`/customers/${row.id}`}
            className="flex min-h-14 items-center gap-3 px-4 py-3 active:bg-neutral-25"
          >
            <Avatar name={row.fullName} />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium leading-[22px] text-neutral-900">
                {row.fullName}
              </span>
              <span className="block text-xs leading-[18px] text-neutral-500">
                Expires {formatTableDate(row.expiryDate, today)}
              </span>
            </span>
            <StatusBadge status={row.status} label={getRemainingLabel(row.daysLeft)} />
          </Link>
        )}
      />
    </div>
  );
}