"use client";

import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import {
  DEFAULT_CURRENCY,
  NOTE_MAX_LENGTH,
  PAYMENT_METHOD_OPTIONS,
  isPaymentMethod,
} from "@/lib/payment";
import type { PaymentFieldErrors, PaymentFormValues } from "@/types";

interface PaymentFieldsProps {
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  /** false = the block is always on (Record payment modal). */
  showEnableToggle?: boolean;
  enableLabel?: string;
  values: PaymentFormValues;
  errors: PaymentFieldErrors;
  onChange: <K extends keyof PaymentFormValues>(field: K, value: PaymentFormValues[K]) => void;
  disabled?: boolean;
}

export function PaymentFields({
  enabled,
  onEnabledChange,
  showEnableToggle = true,
  enableLabel = "Record payment now",
  values,
  errors,
  onChange,
  disabled = false,
}: PaymentFieldsProps) {
  return (
    <fieldset
      disabled={disabled}
      className="flex min-w-0 flex-col gap-4 rounded-[10px] border border-neutral-200 p-4"
    >
      <legend className="px-1 text-sm font-semibold leading-5 text-neutral-900">Payment</legend>

      {showEnableToggle && (
        <label className="flex cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            className="checkbox checkbox-primary checkbox-sm"
            checked={enabled}
            onChange={(event) => onEnabledChange(event.target.checked)}
          />
          <span className="text-sm leading-5 text-neutral-700">{enableLabel}</span>
        </label>
      )}

      {enabled && (
        <>
          <Input
            label={`Amount (${DEFAULT_CURRENCY})`}
            name="paymentAmount"
            type="text"
            inputMode="decimal"
            autoComplete="off"
            placeholder="1500"
            value={values.amount}
            onChange={(event) => onChange("amount", event.target.value)}
            error={errors.amount}
          />

          {!values.unpaid && (
            <>
              <Select
                label="Method"
                name="paymentMethod"
                placeholder="Choose method"
                options={PAYMENT_METHOD_OPTIONS}
                value={values.method}
                onChange={(event) => {
                  if (isPaymentMethod(event.target.value)) onChange("method", event.target.value);
                }}
                error={errors.method}
              />

              <Input
                label="Paid on"
                name="paymentPaidAt"
                type="date"
                value={values.paidAt}
                onChange={(event) => onChange("paidAt", event.target.value)}
                error={errors.paidAt}
              />
            </>
          )}

          <Input
            label="Note (optional)"
            name="paymentNote"
            type="text"
            maxLength={NOTE_MAX_LENGTH}
            autoComplete="off"
            value={values.note}
            onChange={(event) => onChange("note", event.target.value)}
            error={errors.note}
          />

          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              className="checkbox checkbox-primary checkbox-sm mt-0.5"
              checked={values.unpaid}
              onChange={(event) => onChange("unpaid", event.target.checked)}
            />
            <span className="flex flex-col">
              <span className="text-sm font-medium leading-5 text-neutral-700">Mark as unpaid</span>
              <span className="text-sm leading-5 text-neutral-500">
                Keeps the amount. Method and date are not saved.
              </span>
            </span>
          </label>
        </>
      )}
    </fieldset>
  );
}