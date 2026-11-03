"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ExpiringTable } from "@/components/customers/ExpiringTable";
import { PageHeader } from "@/components/layout/PageHeader";
import { AlertBanner } from "@/components/ui/AlertBanner";
import { Button } from "@/components/ui/Button";
import { FilterPill } from "@/components/ui/FilterPill";
import { useDashboardSummary } from "@/hooks/useDashboardSummary";
import { getExpiringBucket, searchCustomers } from "@/lib/customer-list";
import { getToday } from "@/lib/today";
import type { CustomerWithStatus, ExpiringRange } from "@/types";
import { useCustomerModals } from "@/hooks/useCustomerModals";

export default function ExpiringPage() {
  const router = useRouter();
  const today = getToday();
  const { summary, loading, failed, retry } = useDashboardSummary();
  const [query, setQuery] = useState("");
  const [range, setRange] = useState<ExpiringRange>("all");

  const all = useMemo(() => summary?.expiring ?? [], [summary]);

    const { openRenew, openReminder, modals } = useCustomerModals(retry);
  

  const rangeCounts = useMemo(() => {
    const result: Record<ExpiringRange, number> = {
      all: all.length,
      "1-3": 0,
      "4-7": 0,
      "8-10": 0,
    };
    for (const customer of all) {
      result[getExpiringBucket(customer.daysLeft)] += 1;
    }
    return result;
  }, [all]);

  const rows = useMemo(() => {
    const byRange =
      range === "all"
        ? all
        : all.filter((customer) => getExpiringBucket(customer.daysLeft) === range);
    return searchCustomers(byRange, query);
  }, [all, range, query]);

  const total = all.length;
  const subtitle =
    loading || failed
      ? "Subscriptions expiring within the next 10 days"
      : total === 0
        ? "Nothing expiring in the next 10 days"
        : `${total} ${total === 1 ? "subscription expires" : "subscriptions expire"} within the next 10 days`;

  const pills: { value: ExpiringRange; label: string }[] = [
    { value: "all", label: "All" },
    { value: "1-3", label: "1–3 days" },
    { value: "4-7", label: "4–7 days" },
    { value: "8-10", label: "8–10 days" },
  ];

  const openCustomer = (customer: CustomerWithStatus) =>
    router.push(`/customers/${customer.id}`);
  // TODO (task 9): open Send reminder / Renew modals instead.
  const handleReminder = openReminder;
  const handleRenew = openRenew;

  return (
    <>
      <PageHeader
        title="Expiring Soon"
        subtitle={subtitle}
        search={{ value: query, onChange: setQuery }}
      />

      <div className="space-y-5">
        {failed && (
          <AlertBanner
            tone="danger"
            title="Could not load expiring customers"
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
            aria-label="Filter by days left"
            className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:px-0"
          >
            {pills.map((pill) => (
              <FilterPill
                key={pill.value}
                label={pill.label}
                count={rangeCounts[pill.value]}
                selected={range === pill.value}
                onClick={() => setRange(pill.value)}
              />
            ))}
          </div>
        )}

        {!failed && (
          <ExpiringTable
            customers={rows}
            today={today}
            loading={loading}
            isEmptyList={!loading && total === 0}
            onOpen={openCustomer}
            onSendReminder={handleReminder}
            onRenew={handleRenew}
          />
        )}
      </div>
      {modals}
    </>
  );
}