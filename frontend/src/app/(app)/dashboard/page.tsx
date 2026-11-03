"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CircleCheck, Clock, TriangleAlert, Users } from "lucide-react";
import { DashboardExpiredPanel } from "@/components/customers/DashboardExpiredPanel";
import { DashboardExpiringPanel } from "@/components/customers/DashboardExpiringPanel";
import { NeedsAttentionList } from "@/components/customers/NeedsAttentionList";
import { PageHeader } from "@/components/layout/PageHeader";
import { AlertBanner } from "@/components/ui/AlertBanner";
import { Button } from "@/components/ui/Button";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { StatCard } from "@/components/ui/StatCard";
import { getDashboardSummary } from "@/lib/api";
import { searchCustomers } from "@/lib/customer-list";
import { parseISODate } from "@/lib/dates";
import { formatFullDate } from "@/lib/format";
import { getToday } from "@/lib/today";
import type { CustomerWithStatus, DashboardSummary } from "@/types";
import { useCustomerModals } from "@/hooks/useCustomerModals";

function formatMobileLabel(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(parseISODate(iso));
}

export default function DashboardPage() {
  const router = useRouter();
  const today = getToday();

  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [query, setQuery] = useState("");

  
  useEffect(() => {
      let cancelled = false;
      getDashboardSummary()
      .then((data) => {
          if (cancelled) return;
          setSummary(data);
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

  const { openReminder, modals } = useCustomerModals(retry);

  const expiring = useMemo(
    () => (summary ? searchCustomers(summary.expiring, query) : []),
    [summary, query],
  );
  const expired = useMemo(
    () => (summary ? searchCustomers(summary.expired, query) : []),
    [summary, query],
  );
  const attention = useMemo(
      () => [...expired, ...expiring],
      [expired, expiring],
    );

    const counts = summary?.counts;
    const hasQuery = query.trim().length > 0;
    const showBanner =
    !loading && !failed && summary !== null && summary.needsAttention > 0;
    
    const openCustomer = (customer: CustomerWithStatus) =>
        router.push(`/customers/${customer.id}`);
    
    // TODO (task 9): open the Send reminder modal instead.
    const handleReminder = openReminder;
    
    const statValue = (value: number | undefined) =>
        loading || value === undefined ? "—" : value;
    
  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle={`${formatFullDate(today)} · Here is who needs your attention today`}
        mobileLabel={formatMobileLabel(today)}
        hideSubtitleOnMobile
        search={{ value: query, onChange: setQuery }}
        showAddCustomer
      />

      <div className="space-y-6">
        {failed && (
          <AlertBanner
            tone="danger"
            title="Could not load the dashboard"
            action={
              <Button variant="outline" onClick={retry}>
                Try again
              </Button>
            }
          >
            Please check your connection and try again.
          </AlertBanner>
        )}

        {showBanner && summary && (
          <AlertBanner
            tone="warning"
            title={`${summary.needsAttention} ${
              summary.needsAttention === 1 ? "customer needs" : "customers need"
            } your attention`}
            action={
              <ButtonLink href="/expiring" variant="outline">
                Review now
              </ButtonLink>
            }
          >
            {summary.counts.expiring} expire within 10 days and{" "}
            {summary.counts.expired}{" "}
            {summary.counts.expired === 1 ? "has" : "have"} already expired.
          </AlertBanner>
        )}

        <div className="grid grid-cols-3 gap-3 md:grid-cols-2 md:gap-5 lg:grid-cols-4">
          <div className="hidden md:order-none md:block">
            <StatCard
              label="Total customers"
              value={statValue(counts?.total)}
              caption="All saved customers"
              icon={Users}
              tone="neutral"
              loading={loading}
            />
          </div>
          <div className="order-3 md:order-none">
            <StatCard
              label="Active"
              value={statValue(counts?.active)}
              caption="More than 10 days left"
              icon={CircleCheck}
              tone="success"
              loading={loading}
            />
          </div>
          <div className="order-2 md:order-none">
            <StatCard
              label="Expiring soon"
              value={statValue(counts?.expiring)}
              caption="Within the next 10 days"
              icon={Clock}
              tone="warning"
              loading={loading}
            />
          </div>
          <div className="order-1 md:order-none">
            <StatCard
              label="Expired"
              value={statValue(counts?.expired)}
              caption="Follow up to renew"
              icon={TriangleAlert}
              tone="danger"
              loading={loading}
            />
          </div>
        </div>

        {/* Mobile: single list */}
        {!loading && attention.length > 0 && (
          <NeedsAttentionList customers={attention} className="md:hidden" />
        )}

        {/* Desktop / tablet: two panels */}
        <div className="hidden gap-5 md:grid lg:grid-cols-[65fr_35fr]">
          <DashboardExpiringPanel
            customers={expiring}
            today={today}
            loading={loading}
            hasQuery={hasQuery}
            onOpen={openCustomer}
            onSendReminder={handleReminder}
          />
          <DashboardExpiredPanel
            customers={expired}
            loading={loading}
            hasQuery={hasQuery}
            onOpen={openCustomer}
            onMessage={handleReminder}
          />
        </div>
      </div>
      {modals}
    </>
  );
}
