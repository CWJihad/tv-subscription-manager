import { isValidISODate } from "@/lib/dates";
import type { CustomerFieldErrors } from "@/types";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE = /^\+?[0-9\s\-().]{7,20}$/;

export interface CustomerFormValues {
  fullName: string;
  email: string;
  phone: string;
  /** Pass only in create mode. */
  startDate?: string;
}

export function validateCustomer(values: CustomerFormValues): CustomerFieldErrors {
  const errors: CustomerFieldErrors = {};
  if (!values.fullName.trim()) errors.fullName = "Enter the customer's full name.";
  if (!values.phone.trim()) errors.phone = "Enter a phone number.";
  else if (!PHONE.test(values.phone.trim())) errors.phone = "Enter a valid phone number.";
  if (values.email.trim() && !EMAIL.test(values.email.trim())) {
    errors.email = "Enter a valid email address.";
  }
  if (values.startDate !== undefined && !isValidISODate(values.startDate)) {
    errors.startDate = "Choose a valid start date.";
  }
  return errors;
}