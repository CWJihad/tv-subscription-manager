"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  MessageCircle,
  Pencil,
  RefreshCw,
  Trash2,
  Users,
} from "lucide-react";
import { ContactCard } from "@/components/customers/ContactCard";
import { DeleteCustomerModal } from "@/components/customers/DeleteCustomerModal";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { EmptyState } from "@/components/ui/EmptyState";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useCustomerModals } from "@/hooks/useCustomerModals";
import { getCustomer } from "@/lib/api";
import { diffInDays } from "@/lib/dates";
import {
  formatDuration,
  formatLongDate,
  getExpiredAgoLabel,
  getRemainingLabel,
} from "@/lib/format";
import { getToday } from "@/lib/today";
import type { StatusTone } from "@/lib/tones";
import type { CustomerWithStatus, SubscriptionStatus } from "@/types";

const statusTone: Record<SubscriptionStatus, StatusTone> = {
  active: "success",
  expiring: "warning",
  expired: "danger",
};

const toneText: Record<StatusTone, string> = {
  success: "text-success-600",
  warning: "text-warning-600",
  danger: "text-danger-600",
};

const statusWord: Record<SubscriptionStatus, string> = {
  active: "Active",
  expiring: "Expiring",
  expired: "Expired",
};

function getProgress(start: string, expiry: string, today: string): number {
  const total = diffInDays(start, expiry);
  if (total <= 0) return 100;
  const elapsed = diffInDays(start, today);
  return Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)));
}

export default function CustomerDetailsPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const today = getToday();

  const [customer, setCustomer] = useState<CustomerWithStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState<CustomerWithStatus | null>(
    null,
  );
  

  useEffect(() => {
    let cancelled = false;
    getCustomer(id)
      .then((data) => {
        if (cancelled) return;
        setCustomer(data);
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
  }, [id, reloadKey]);

//   const { openRenew, openReminder, modals } = useCustomerModals(() =>
//     setReloadKey((key) => key + 1),
//   );

const retry = () => {
    setLoading(true);
    setFailed(false);
    setReloadKey((key) => key + 1);
};

  const { openRenew, openReminder, modals } = useCustomerModals(retry);
  const handleMessage = openReminder;
  const handleRenew = openRenew;

  const back = (
    <Link
      href="/customers"
      className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-primary-600 hover:text-primary-700"
    >
      <ArrowLeft className="size-4" aria-hidden="true" />
      Customers
    </Link>
  );

  if (loading) {
    return (
      <>
        {back}
        <div className="space-y-5" aria-busy="true">
          <div className="skeleton h-20 w-full" />
          <div className="skeleton h-64 w-full" />
        </div>
      </>
    );
  }

  if (failed || !customer) {
    return (
      <>
        {back}
        <div className="rounded-2xl border border-neutral-200 bg-neutral-0">
          <EmptyState
            icon={Users}
            // tone="neutral"
            title="Customer not found"
            text="This customer does not exist or could not be loaded."
            action={
              <Button
                variant="outline"
                onClick={() => {
                  setLoading(true);
                  setReloadKey((key) => key + 1);
                }}
              >
                Try again
              </Button>
            }
          />
        </div>
      </>
    );
  }

  const tone = statusTone[customer.status];
  const expired = customer.status === "expired";
  const remaining = expired
    ? `Expired ${getExpiredAgoLabel(customer.daysLeft)}`
    : getRemainingLabel(customer.daysLeft);
  const badgeLabel = `${statusWord[customer.status]} · ${
    expired
      ? getExpiredAgoLabel(customer.daysLeft)
      : getRemainingLabel(customer.daysLeft)
  }`;
  const history = [...customer.renewals].reverse();
  const card = "rounded-2xl border border-neutral-200 bg-neutral-0 p-6";

  return (
    <>
      {back}

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar name={customer.fullName} size="lg" />
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-[28px] font-semibold leading-9 text-neutral-900">
                {customer.fullName}
              </h1>
              <StatusBadge status={customer.status} label={badgeLabel} />
            </div>
            <p className="text-xs leading-[18px] text-neutral-500">
              Customer since {formatLongDate(customer.customerSince)}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <ButtonLink
            href={`/customers/${customer.id}/edit`}
            variant="outline"
            leftIcon={<Pencil className="size-4" aria-hidden="true" />}
          >
            Edit
          </ButtonLink>
          <Button
            variant="soft"
            leftIcon={<MessageCircle className="size-4" aria-hidden="true" />}
            onClick={() => handleMessage(customer)}
          >
            Send Reminder
          </Button>
          <Button
            variant="primary"
            leftIcon={<RefreshCw className="size-4" aria-hidden="true" />}
            onClick={() => handleRenew(customer)}
          >
            Renew Subscription
          </Button>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_380px]">
        <div className="space-y-5">
          <section className={card}>
            <h2 className="text-[18px] font-semibold leading-[26px] text-neutral-900">
              Subscription
            </h2>
            <p className="mb-4 text-xs leading-[18px] text-neutral-500">
              Current plan details
            </p>
            <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
              <p
                className={`text-[28px] font-semibold leading-9 ${toneText[tone]}`}
              >
                {remaining}
              </p>
              <p className="text-sm leading-[22px] text-neutral-700">
                {expired ? "Expired" : "Expires"}{" "}
                {formatLongDate(customer.expiryDate)}
              </p>
            </div>
            <ProgressBar
              value={getProgress(
                customer.currentStartDate,
                customer.expiryDate,
                today,
              )}
              tone={tone}
              startLabel={formatLongDate(customer.currentStartDate)}
              endLabel={formatLongDate(customer.expiryDate)}
              label="Subscription progress"
            />
            <dl className="mt-5 divide-y divide-neutral-200 text-sm leading-[22px]">
              <div className="flex justify-between py-3">
                <dt className="text-neutral-500">Start date</dt>
                <dd className="font-medium text-neutral-900">
                  {formatLongDate(customer.currentStartDate)}
                </dd>
              </div>
              <div className="flex justify-between py-3">
                <dt className="text-neutral-500">Duration</dt>
                <dd className="font-medium text-neutral-900">
                  {formatDuration(customer.durationMonths)}
                </dd>
              </div>
              <div className="flex justify-between py-3">
                <dt className="text-neutral-500">Expiration date</dt>
                <dd className="font-medium text-neutral-900">
                  {formatLongDate(customer.expiryDate)}
                </dd>
              </div>
            </dl>
          </section>

          <section className={card}>
            <h2 className="text-[18px] font-semibold leading-[26px] text-neutral-900">
              Renewal history
            </h2>
            <p className="mb-4 text-xs leading-[18px] text-neutral-500">
              Every time this subscription was renewed
            </p>
            <ul className="space-y-4">
              {history.map((entry) => (
                <li key={entry.id} className="flex items-center gap-3">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-success-50 text-success-600">
                    <Check className="size-4" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-sm font-medium leading-[22px] text-neutral-900">
                      {entry.kind === "first"
                        ? `First subscription · ${formatDuration(entry.durationMonths)}`
                        : `Renewed for ${formatDuration(entry.durationMonths)}`}
                    </p>
                    <p className="text-xs leading-[18px] text-neutral-500">
                      {formatLongDate(entry.from)} → {formatLongDate(entry.to)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <div className="space-y-5">
          <ContactCard phone={customer.phone} email={customer.email} />
          <section className={card}>
            <h2 className="mb-1 text-[18px] font-semibold leading-[26px] text-neutral-900">
              Delete customer
            </h2>
            <p className="mb-4 text-sm leading-[22px] text-neutral-500">
              Removes this customer and their subscription records. This cannot
              be undone.
            </p>
            <Button
              variant="outline"
              leftIcon={<Trash2 className="size-4" aria-hidden="true" />}
              onClick={() => setDeleteTarget(customer)}
            >
              Delete customer
            </Button>
          </section>
        </div>
      </div>

      {modals}
      <DeleteCustomerModal
        customer={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onDeleted={() => router.push("/customers")}
      />
      {modals}
    </>
  );
}
