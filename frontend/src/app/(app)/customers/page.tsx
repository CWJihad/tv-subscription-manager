"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CustomersTable } from "@/components/customers/CustomersTable";
import { PageHeader } from "@/components/layout/PageHeader";
import { AlertBanner } from "@/components/ui/AlertBanner";
import { Button } from "@/components/ui/Button";
import { FilterPill } from "@/components/ui/FilterPill";
import { getCustomers } from "@/lib/api";
import { countByStatus, filterByStatus, searchCustomers } from "@/lib/customer-list";
import { getToday } from "@/lib/today";
import type { CustomerFilter, CustomerWithStatus } from "@/types";

export default function CustomersPage() {
  const router = useRouter();
  const today = getToday();

  const [customers, setCustomers] = useState<CustomerWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<CustomerFilter>("all");

  useEffect(() => {
    let cancelled = false;
    getCustomers()
      .then((data) => {
        if (cancelled) return;
        setCustomers(data);
        setFailed(false);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setFailed(true);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const retry = () => {
    setLoading(true);
    setFailed(false);
    setReloadKey((key) => key + 1);
  };

  const counts = useMemo(() => countByStatus(customers), [customers]);
  const rows = useMemo(
    () => searchCustomers(filterByStatus(customers, filter), query),
    [customers, filter, query],
  );

  const total = counts.total;
  const subtitle = loading
    ? "Manage subscriptions and renewals"
    : total === 0
      ? "0 customers"
      : `${total} ${total === 1 ? "customer" : "customers"} · Manage subscriptions and renewals`;

  const pills: { value: CustomerFilter; label: string; count: number }[] = [
    { value: "all", label: "All", count: counts.total },
    { value: "active", label: "Active", count: counts.active },
    { value: "expiring", label: "Expiring soon", count: counts.expiring },
    { value: "expired", label: "Expired", count: counts.expired },
  ];

  const openCustomer = (customer: CustomerWithStatus) =>
    router.push(`/customers/${customer.id}`);
  // TODO (task 9): open Renew / Send reminder modals instead.
  const handleMessage = openCustomer;
  const handleRenew = openCustomer;

  return (
    <>
      <PageHeader
        title="Customers"
        subtitle={subtitle}
        search={{ value: query, onChange: setQuery }}
        showAddCustomer
      />

      <div className="space-y-5">
        {failed && (
          <AlertBanner
            tone="danger"
            title="Could not load customers"
            action={
              <Button variant="outline" onClick={retry}>
                Try again
              </Button>
            }
          >
            Please check your connection and try again.
          </AlertBanner>
        )}

        {!loading && total > 0 && (
          <div
            role="group"
            aria-label="Filter customers by status"
            className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:px-0"
          >
            {pills.map((pill) => (
              <FilterPill
                key={pill.value}
                label={pill.label}
                count={pill.count}
                selected={filter === pill.value}
                onClick={() => setFilter(pill.value)}
              />
            ))}
          </div>
        )}

        {!failed && (
          <CustomersTable
            customers={rows}
            today={today}
            loading={loading}
            isEmptyList={!loading && total === 0}
            onOpen={openCustomer}
            onMessage={handleMessage}
            onRenew={handleRenew}
          />
        )}
      </div>
    </>
  );
}