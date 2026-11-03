"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ExpiredTable } from "@/components/customers/ExpiredTable";
import { PageHeader } from "@/components/layout/PageHeader";
import { AlertBanner } from "@/components/ui/AlertBanner";
import { Button } from "@/components/ui/Button";
import { useDashboardSummary } from "@/hooks/useDashboardSummary";
import { searchCustomers } from "@/lib/customer-list";
import { getToday } from "@/lib/today";
import type { CustomerWithStatus } from "@/types";

export default function ExpiredPage() {
  const router = useRouter();
  const today = getToday();
  const { summary, loading, failed, retry } = useDashboardSummary();
  const [query, setQuery] = useState("");

  const all = useMemo(() => summary?.expired ?? [], [summary]);
  const rows = useMemo(() => searchCustomers(all, query), [all, query]);

  const total = all.length;
  const subtitle =
    loading || failed
      ? "Renew them or follow up"
      : total === 0
        ? "No expired subscriptions"
        : `${total} ${total === 1 ? "subscription has" : "subscriptions have"} expired · Renew them or follow up`;

  const openCustomer = (customer: CustomerWithStatus) =>
    router.push(`/customers/${customer.id}`);
  // TODO (task 9): open Renew / Send reminder modals instead.
  const handleMessage = openCustomer;
  const handleRenew = openCustomer;

  return (
    <>
      <PageHeader
        title="Expired"
        subtitle={subtitle}
        search={{ value: query, onChange: setQuery }}
      />

      <div className="space-y-5">
        {failed && (
          <AlertBanner
            tone="danger"
            title="Could not load expired customers"
            action={
              <Button variant="outline" onClick={retry}>
                Try again
              </Button>
            }
          >
            Please check your connection and try again.
          </AlertBanner>
        )}

        {!failed && (
          <ExpiredTable
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