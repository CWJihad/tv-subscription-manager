import { validateContact } from "@/lib/validation";
import { isValidISODate } from "@/lib/dates";
import type { CustomerFieldErrors } from "@/types";

export interface CustomerFormValues {
  fullName: string;
  email: string;
  phone: string;
  startDate?: string;
}

export function validateCustomer(values: CustomerFormValues): CustomerFieldErrors {
  const errors = validateContact(values);
  if (values.startDate !== undefined && !isValidISODate(values.startDate)) {
    errors.startDate = "Choose a valid start date";
  }
  return errors;
}