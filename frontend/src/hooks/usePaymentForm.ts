"use client";

import { useState } from "react";
import {
  DEFAULT_PAYMENT_METHOD,
  getPrefillAmount,
  hasPaymentErrors,
  paymentToFormValues,
  toPaymentInput,
  validatePayment,
} from "@/lib/payment";
import { getToday } from "@/lib/today";
import type {
  DurationMonths,
  Payment,
  PaymentFieldErrors,
  PaymentFormValues,
  PaymentInput,
  PriceSettings,
} from "@/types";

interface Options {
  prices: PriceSettings | null;
  /** Used for the amount prefill. null = no prefill. */
  durationMonths: DurationMonths | null;
  /** Is the payment block on when the form opens? */
  defaultEnabled: boolean;
  /** Start from a saved payment (edit mode). */
  initialPayment?: Payment | null;
}

function withoutError(
  errors: PaymentFieldErrors,
  field: keyof PaymentFormValues,
): PaymentFieldErrors {
  if (field === "unpaid") return {}; // the rules change, so old errors no longer apply
  if (!errors[field]) return errors;
  const next = { ...errors };
  delete next[field];
  return next;
}

/**
 * Only the fields the user changed are stored ("edits").
 * Everything else is derived, so the amount follows the selected duration and the
 * saved price until the user types their own amount. No effects needed.
 */
export function usePaymentForm({
  prices,
  durationMonths,
  defaultEnabled,
  initialPayment,
}: Options) {
  const [enabled, setEnabledState] = useState(defaultEnabled);
  const [edits, setEdits] = useState<Partial<PaymentFormValues>>(() =>
    initialPayment ? paymentToFormValues(initialPayment) : {},
  );
  const [errors, setErrors] = useState<PaymentFieldErrors>({});

  const values: PaymentFormValues = {
    amount: edits.amount ?? getPrefillAmount(prices, durationMonths),
    method: edits.method ?? DEFAULT_PAYMENT_METHOD,
    paidAt: edits.paidAt ?? getToday(),
    note: edits.note ?? "",
    unpaid: edits.unpaid ?? false,
  };

  function setEnabled(next: boolean): void {
    setEnabledState(next);
    setErrors({});
  }

  function setField<K extends keyof PaymentFormValues>(field: K, value: PaymentFormValues[K]): void {
    setEdits((previous) => ({ ...previous, [field]: value }));
    setErrors((previous) => withoutError(previous, field));
  }

  /** true = ok to submit. A turned-off block is always ok. */
  function validate(): boolean {
    if (!enabled) return true;
    const next = validatePayment(values);
    setErrors(next);
    return !hasPaymentErrors(next);
  }

  /** The `payment` request block, or undefined when the block is off. */
  function toInput(): PaymentInput | undefined {
    return enabled ? toPaymentInput(values) : undefined;
  }

  function reset(): void {
    setEnabledState(defaultEnabled);
    setEdits(initialPayment ? paymentToFormValues(initialPayment) : {});
    setErrors({});
  }

  return { enabled, setEnabled, values, errors, setField, validate, toInput, reset };
}