import type { PaymentMethod } from "./customer";

/** What the payment form edits. Everything is a string, as typed by the user. */
export interface PaymentFormValues {
  amount: string;
  method: PaymentMethod | "";
  paidAt: string; // YYYY-MM-DD
  note: string;
  unpaid: boolean;
}

export type PaymentField = "amount" | "method" | "paidAt" | "note";
export type PaymentFieldErrors = Partial<Record<PaymentField, string>>;