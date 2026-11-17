"use client";

import { useState } from "react";
import { Check, RefreshCw } from "lucide-react";
import { PaymentFields } from "@/components/customers/PaymentFields";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { RadioCard } from "@/components/ui/RadioCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { usePaymentForm } from "@/hooks/usePaymentForm";
import { usePrices } from "@/hooks/usePrices";
import { useToast } from "@/hooks/useToast";
import { ApiError, renewCustomer } from "@/lib/api";
import { formatLongDate, getStatusLabel } from "@/lib/format";
import { getRenewalPreview } from "@/lib/subscription";
import { getToday } from "@/lib/today";
import type { CustomerWithStatus, DurationMonths } from "@/types";

const DURATIONS: DurationMonths[] = [3, 6, 12];

export interface RenewModalProps {
  customer: CustomerWithStatus | null;
  onClose: () => void;
  /** Called after a renewal, and also after a 409 conflict so the parent can refetch its data. */
  onRenewed?: () => void;
}

export function RenewModal({ customer, onClose, onRenewed }: RenewModalProps) {
  if (!customer) return null;
  return (
    <RenewModalContent key={customer.id} customer={customer} onClose={onClose} onRenewed={onRenewed} />
  );
}

function RenewModalContent({
  customer,
  onClose,
  onRenewed,
}: {
  customer: CustomerWithStatus;
  onClose: () => void;
  onRenewed?: () => void;
}) {
  const { show } = useToast();
  const [months, setMonths] = useState<DurationMonths>(3);
  const [saving, setSaving] = useState(false);

  const { prices } = usePrices();
  const payment = usePaymentForm({ prices, durationMonths: months, defaultEnabled: true });

  // Same rule as the backend: start = max(current expiry, today), end = start + duration.
  const preview = getRenewalPreview(customer.expiryDate, getToday(), months);
  const startsFromToday = preview.from !== customer.expiryDate;

  const confirm = async () => {
    if (saving) return;
    if (!payment.validate()) return;

    setSaving(true);
    try {
      await renewCustomer(customer.id, months, payment.toInput());
      show({
        type: "success",
        title: "Subscription renewed",
        message: `${customer.fullName} · new expiry ${formatLongDate(preview.to)}`,
      });
      onRenewed?.();
      onClose();
    } catch (error) {
      setSaving(false);
      const apiError = error instanceof ApiError ? error : null;
      show({
        type: "error",
        title: "Could not renew subscription",
        message: apiError?.message ?? "Please try again.",
      });
      // 409: the subscription was changed elsewhere. The preview is stale, so refetch and close.
      if (apiError?.status === 409) {
        onRenewed?.();
        onClose();
      }
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title="Renew subscription"
      subtitle={customer.fullName}
      icon={RefreshCw}
      iconTone="primary"
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button
            variant="primary"
            loading={saving}
            leftIcon={<Check className="size-4" aria-hidden="true" />}
            onClick={confirm}
          >
            Confirm renewal
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        <div className="flex items-center justify-between gap-3 rounded-xl bg-neutral-100 px-4 py-3">
          <div>
            <p className="text-xs leading-[18px] text-neutral-500">Current expiry</p>
            <p className="text-sm font-medium leading-[22px] text-neutral-900">
              {formatLongDate(customer.expiryDate)}
            </p>
          </div>
          <StatusBadge
            status={customer.status}
            label={getStatusLabel(customer.status, customer.daysLeft)}
          />
        </div>

        <div>
          <p className="mb-2 text-[13px] font-medium leading-[18px] text-neutral-700">
            Renewal duration
          </p>
          <div role="radiogroup" aria-label="Renewal duration" className="grid grid-cols-3 gap-3">
            {DURATIONS.map((m) => (
              <RadioCard
                key={m}
                name="renewal-duration"
                value={String(m)}
                checked={months === m}
                onChange={() => setMonths(m)}
                title={`${m} months`}
              />
            ))}
          </div>
        </div>

        <div className="rounded-xl bg-primary-50 px-4 py-3">
          <p className="text-xs leading-[18px] text-neutral-500">New expiration date</p>
          <p className="text-[22px] font-semibold leading-[30px] text-primary-600">
            {formatLongDate(preview.to)}
          </p>
        </div>

        {startsFromToday && (
          <p className="text-xs leading-[18px] text-neutral-500">
            This subscription already expired, so the renewal starts today ({formatLongDate(preview.from)}).
          </p>
        )}

        <PaymentFields
          enabled={payment.enabled}
          onEnabledChange={payment.setEnabled}
          values={payment.values}
          errors={payment.errors}
          onChange={payment.setField}
          disabled={saving}
        />
      </div>
    </Modal>
  );
}