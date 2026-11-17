"use client";

import { useRef, useState, type FormEvent } from "react";
import { Check, Wallet } from "lucide-react";
import { PaymentFields } from "@/components/customers/PaymentFields";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { usePaymentForm } from "@/hooks/usePaymentForm";
import { usePrices } from "@/hooks/usePrices";
import { useToast } from "@/hooks/useToast";
import { ApiError, upsertPayment } from "@/lib/api";
import { formatLongDate } from "@/lib/format";
import type { Renewal } from "@/types";

const FORM_ID = "record-payment-form";
const GENERIC_ERROR = "Could not save the payment. Please try again.";

interface RecordPaymentModalProps {
  customerId: string;
  renewal: Renewal;
  onClose: () => void;
  /** Called after a successful save, before the modal closes (refetch the customer here). */
  onSaved?: () => void;
}

/** Render only while a renewal is selected (the state resets on every open). */
export function RecordPaymentModal({ customerId, renewal, onClose, onSaved }: RecordPaymentModalProps) {
  const { show } = useToast();
  const { prices } = usePrices();
  const form = usePaymentForm({
    prices,
    durationMonths: renewal.durationMonths,
    defaultEnabled: true,
    initialPayment: renewal.payment,
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const submittingRef = useRef(false);

  const isEdit = renewal.payment !== null;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submittingRef.current) return;
    setFormError(null);
    if (!form.validate()) return;
    const input = form.toInput();
    if (!input) return;

    submittingRef.current = true;
    setSaving(true);
    try {
      await upsertPayment(customerId, renewal.id, input);
      show({ type: "success", title: isEdit ? "Payment updated" : "Payment saved" });
      onSaved?.();
      onClose();
    } catch (error) {
      setFormError(error instanceof ApiError ? error.message : GENERIC_ERROR);
    } finally {
      submittingRef.current = false;
      setSaving(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={isEdit ? "Edit payment" : "Record payment"}
      subtitle={`${formatLongDate(renewal.from)} → ${formatLongDate(renewal.to)}`}
      icon={Wallet}
      iconTone="primary"
      footer={
        <>
          <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button
            type="submit"
            form={FORM_ID}
            variant="primary"
            loading={saving}
            leftIcon={<Check className="size-4" aria-hidden="true" />}
          >
            Save payment
          </Button>
        </>
      }
    >
      <form id={FORM_ID} onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <PaymentFields
          enabled={form.enabled}
          onEnabledChange={form.setEnabled}
          showEnableToggle={false}
          values={form.values}
          errors={form.errors}
          onChange={form.setField}
          disabled={saving}
        />

        {formError && (
          <div
            role="alert"
            className="rounded-[10px] border border-danger-600 bg-danger-50 px-4 py-3 text-sm leading-[22px] text-danger-700"
          >
            {formError}
          </div>
        )}
      </form>
    </Modal>
  );
}