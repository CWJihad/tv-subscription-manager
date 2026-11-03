import { DURATION_OPTIONS } from "@/lib/constants";
import { isValidISODate } from "@/lib/dates";
import type { CreateCustomerInput, CustomerFieldErrors, UpdateCustomerInput } from "@/types";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_CHARS_RE = /^\+?[\d\s()-]+$/;

/** Name and phone required, email optional (default until the senior answers). */
export function validateContact(input: UpdateCustomerInput): CustomerFieldErrors {
  const errors: CustomerFieldErrors = {};
  const name = input.fullName.trim();
  const phone = input.phone.trim();
  const email = input.email.trim();

  if (!name) errors.fullName = "Full name is required";

  if (!phone) {
    errors.phone = "Phone number is required";
  } else {
    const digitCount = phone.replace(/\D/g, "").length;
    if (!PHONE_CHARS_RE.test(phone) || digitCount < 7 || digitCount > 15) {
      errors.phone = "Enter a valid phone number";
    }
  }

  if (email && !EMAIL_RE.test(email)) errors.email = "Enter a valid email address";

  return errors;
}

export function validateCreateCustomer(input: CreateCustomerInput): CustomerFieldErrors {
  const errors = validateContact(input);
  if (!isValidISODate(input.startDate)) errors.startDate = "Choose a valid start date";
  if (!DURATION_OPTIONS.includes(input.durationMonths)) errors.durationMonths = "Choose a duration";
  return errors;
}

export function hasErrors(errors: CustomerFieldErrors): boolean {
  return Object.keys(errors).length > 0;
}