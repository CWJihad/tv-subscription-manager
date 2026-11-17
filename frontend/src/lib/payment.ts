// Pure payment helpers: options, money format, amount parsing, validation, request body.

import { isValidISODate } from "@/lib/dates";
import { formatLongDate } from "@/lib/format";
import type {
  DurationMonths,
  Payment,
  PaymentField,
  PaymentFieldErrors,
  PaymentFormValues,
  PaymentInput,
  PaymentMethod,
  PriceSettings,
} from "@/types";

export const DEFAULT_CURRENCY = "BDT";
export const DEFAULT_PAYMENT_METHOD: PaymentMethod = "cash";
export const NOTE_MAX_LENGTH = 200;

export const PAYMENT_METHOD_OPTIONS: { value: PaymentMethod; label: string }[] = [
  { value: "cash", label: "Cash" },
  { value: "bkash", label: "bKash" },
  { value: "nagad", label: "Nagad" },
  { value: "rocket", label: "Rocket" },
  { value: "bank_transfer", label: "Bank transfer" },
  { value: "other", label: "Other" },
];

export function isPaymentMethod(value: string): value is PaymentMethod {
  return PAYMENT_METHOD_OPTIONS.some((option) => option.value === value);
}

export function getMethodLabel(method: PaymentMethod): string {
  return PAYMENT_METHOD_OPTIONS.find((option) => option.value === method)?.label ?? method;
}

const CURRENCY_SYMBOLS: Record<string, string> = { BDT: "৳" };
const numberFormat = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });

/** ৳1,500 (BDT) or "USD 1,500" for other currencies. */
export function formatMoney(amount: number, currency: string = DEFAULT_CURRENCY): string {
  const symbol = CURRENCY_SYMBOLS[currency];
  const value = numberFormat.format(amount);
  return symbol ? `${symbol}${value}` : `${currency} ${value}`;
}

/* ------------------------------ prices ------------------------------ */

export function getPriceForDuration(
  prices: PriceSettings | null,
  months: DurationMonths,
): number | null {
  if (!prices) return null;
  if (months === 3) return prices.m3;
  if (months === 6) return prices.m6;
  return prices.m12;
}

/** Text for the amount field: the saved price, or "" when there is none. */
export function getPrefillAmount(
  prices: PriceSettings | null,
  months: DurationMonths | null,
): string {
  if (months === null) return "";
  const price = getPriceForDuration(prices, months);
  return price === null ? "" : String(price);
}

/* ------------------------------ amount ------------------------------ */

const AMOUNT_RE = /^\d+(\.\d{1,2})?$/;

/** "1500", "1,500", "1500.50" -> number. Anything else -> null. */
export function parseAmount(text: string): number | null {
  const cleaned = text.trim().replace(/,/g, "");
  if (!AMOUNT_RE.test(cleaned)) return null;
  return Number(cleaned);
}

/* ---------------------------- validation ---------------------------- */

/** Mirrors the backend rules. Paid: amount > 0, method, date. Unpaid: amount only. */
export function validatePayment(values: PaymentFormValues): PaymentFieldErrors {
  const errors: PaymentFieldErrors = {};

  if (values.amount.trim() === "") {
    errors.amount = "Enter the amount";
  } else {
    const amount = parseAmount(values.amount);
    if (amount === null) errors.amount = "Enter a valid amount (up to 2 decimals)";
    else if (!values.unpaid && amount <= 0) errors.amount = "Amount must be more than 0";
  }

  if (!values.unpaid) {
    if (values.method === "") errors.method = "Choose a payment method";
    if (!isValidISODate(values.paidAt)) errors.paidAt = "Choose a valid payment date";
  }

  if (values.note.trim().length > NOTE_MAX_LENGTH) {
    errors.note = `Note must be ${NOTE_MAX_LENGTH} characters or less`;
  }

  return errors;
}

export function hasPaymentErrors(errors: PaymentFieldErrors): boolean {
  return (Object.keys(errors) as PaymentField[]).length > 0;
}

/** Request body. Call only after validatePayment() returned no errors. */
export function toPaymentInput(values: PaymentFormValues): PaymentInput {
  const input: PaymentInput = {
    amount: parseAmount(values.amount) ?? 0,
    status: values.unpaid ? "unpaid" : "paid",
    note: values.note.trim(), // always sent, so an old note can be cleared
  };
  if (!values.unpaid) {
    if (values.method !== "") input.method = values.method;
    input.paidAt = values.paidAt;
  }
  return input;
}

/** Starting values when editing a saved payment. Missing method/date fall back to the defaults. */
export function paymentToFormValues(payment: Payment): Partial<PaymentFormValues> {
  const values: Partial<PaymentFormValues> = {
    amount: String(payment.amount),
    note: payment.note ?? "",
    unpaid: payment.status === "unpaid",
  };
  if (payment.method) values.method = payment.method;
  if (payment.paidAt) values.paidAt = payment.paidAt;
  return values;
}

/* ------------------------------ display ----------------------------- */

export type PaymentTone = "success" | "warning" | "neutral";

export function getPaymentBadge(payment: Payment | null): { label: string; tone: PaymentTone } {
  if (!payment) return { label: "Not recorded", tone: "neutral" };
  if (payment.status === "paid") return { label: "Paid", tone: "success" };
  return { label: "Unpaid", tone: "warning" };
}

/** "৳1,500 · Cash · Apr 8, 2026" (paid) or "৳1,500" (unpaid). */
export function getPaymentSummaryText(payment: Payment): string {
  const parts = [formatMoney(payment.amount, payment.currency)];
  if (payment.status === "paid") {
    if (payment.method) parts.push(getMethodLabel(payment.method));
    if (payment.paidAt) parts.push(formatLongDate(payment.paidAt));
  }
  return parts.join(" · ");
}