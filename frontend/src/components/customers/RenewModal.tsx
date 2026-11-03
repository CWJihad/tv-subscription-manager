"use client";

import { useState } from "react";
import { Check, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { RadioCard } from "@/components/ui/RadioCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useToast } from "@/hooks/useToast";
import { renewCustomer } from "@/lib/api";
import { addMonths } from "@/lib/dates";
import { formatLongDate, getStatusLabel } from "@/lib/format";
import type { CustomerWithStatus, DurationMonths } from "@/types";

const DURATIONS: DurationMonths[] = [3, 6, 12];

export interface RenewModalProps {
  customer: CustomerWithStatus | null;
  onClose: () => void;
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
  const newExpiry = addMonths(customer.expiryDate, months);

  const confirm = async () => {
    setSaving(true);
    try {
      await renewCustomer(customer.id, months);
      show({
        type: "success",
        title: "Subscription renewed",
        message: `${customer.fullName} · new expiry ${formatLongDate(newExpiry)}`,
      });
      onRenewed?.();
      onClose();
    } catch {
      setSaving(false);
      show({
        type: "error",
        title: "Could not renew subscription",
        message: "Please try again.",
      });
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
            {formatLongDate(newExpiry)}
          </p>
        </div>

        <p className="text-xs leading-[18px] text-neutral-500">
          Payment happens outside this app. Confirming only updates the customer record.
        </p>
      </div>
    </Modal>
  );
}