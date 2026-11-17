import type { ChangePasswordFormErrors, ChangePasswordFormValues } from "@/types";

export const PASSWORD_HINT = "At least 8 characters, with a letter and a number";
/** Same text as the backend 400, so client and server agree. */
export const SAME_PASSWORD_MESSAGE = "New password cannot be the same as old password";

/** Rule for the NEW password only. The current password has no complexity rule. */
export function getNewPasswordError(value: string): string | null {
  if (value.length < 8) return "Use at least 8 characters.";
  if (!/[A-Za-z]/.test(value) || !/\d/.test(value)) {
    return "Include at least one letter and one number.";
  }
  return null;
}

export function validateChangePassword(values: ChangePasswordFormValues): ChangePasswordFormErrors {
  const errors: ChangePasswordFormErrors = {};

  if (!values.current) errors.current = "Enter your current password.";

  const rule = getNewPasswordError(values.next);
  if (rule) errors.next = rule;
  else if (values.current && values.next === values.current) errors.next = SAME_PASSWORD_MESSAGE;

  if (values.confirm !== values.next) errors.confirm = "Passwords do not match.";

  return errors;
}

export function hasPasswordErrors(errors: ChangePasswordFormErrors): boolean {
  return Object.values(errors).some(Boolean);
}