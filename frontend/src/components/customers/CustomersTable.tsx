"use client";

import Link from "next/link";
import { Search, Users } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { DataTable, type DataTableColumn } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  formatDurationShort,
  formatLongDate,
  formatTableDate,
  getStatusLabel,
} from "@/lib/format";
import type { CustomerWithStatus } from "@/types";

export interface CustomersTableProps {
  customers: CustomerWithStatus[];
  today: string;
  loading?: boolean;
  /** True when there are no customers at all (not just no matches). */
  isEmptyList?: boolean;
  onOpen: (customer: CustomerWithStatus) => void;
  onMessage: (customer: CustomerWithStatus) => void;
  onRenew: (customer: CustomerWithStatus) => void;
}

export function CustomersTable({
  customers,
  today,
  loading = false,
  isEmptyList = false,
  onOpen,
  onMessage,
  onRenew,
}: CustomersTableProps) {
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
      key: "start",
      header: "START DATE",
      cell: (row) => (
        <span className="whitespace-nowrap text-sm leading-[22px] text-neutral-700">
          {formatLongDate(row.currentStartDate)}
        </span>
      ),
    },
    {
      key: "duration",
      header: "DURATION",
      cell: (row) => (
        <span className="text-sm leading-[22px] text-neutral-700">
          {formatDurationShort(row.durationMonths)}
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
      key: "status",
      header: "STATUS",
      cell: (row) => (
        <StatusBadge status={row.status} label={getStatusLabel(row.status, row.daysLeft)} />
      ),
    },
    {
      key: "actions",
      header: "ACTIONS",
      cell: (row) => {
        const expired = row.status === "expired";
        const stop =
          (fn: (c: CustomerWithStatus) => void) => (event: React.MouseEvent) => {
            event.stopPropagation();
            fn(row);
          };
        return (
          <div className="flex items-center gap-2">
            {expired ? (
              <>
                <Button variant="primary" onClick={stop(onRenew)}>
                  Renew
                </Button>
                <Button variant="outline" onClick={stop(onMessage)}>
                  Message
                </Button>
              </>
            ) : (
              <>
                <Button variant="soft" onClick={stop(onMessage)}>
                  Message
                </Button>
                <Button variant="outline" onClick={stop(onRenew)}>
                  Renew
                </Button>
              </>
            )}
          </div>
        );
      },
    },
  ];

  const emptyState = isEmptyList ? (
    <EmptyState
      icon={Users}
      tone="primary"
      title="No customers yet"
      text="Add your first customer to start tracking subscriptions and expiry dates."
      action={
        <ButtonLink href="/customers/new" variant="primary">
          + Add Customer
        </ButtonLink>
      }
    />
  ) : (
    <EmptyState
      icon={Search}
    //   tone="neutral"
      title="No matches"
      text="No customer matches your search or filter."
    />
  );

  return (
    <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-0">
      <DataTable
        columns={columns}
        rows={customers}
        getRowKey={(row) => row.id}
        ariaLabel="Customers"
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
                {row.status === "expired" ? "Expired" : "Expires"}{" "}
                {formatTableDate(row.expiryDate, today)}
              </span>
            </span>
            <StatusBadge status={row.status} label={getStatusLabel(row.status, row.daysLeft)} />
          </Link>
        )}
      />
    </div>
  );
}