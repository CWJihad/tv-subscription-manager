import { formatLongDate, getFirstName } from "@/lib/format";
import type { Customer } from "@/types";

export type ReminderTemplate = "7" | "3" | "1" | "expired";

export const REMINDER_TEMPLATES: { value: ReminderTemplate; label: string }[] = [
  { value: "7", label: "7 days left" },
  { value: "3", label: "3 days left" },
  { value: "1", label: "1 day left" },
  { value: "expired", label: "Expired" },
];

export function getDefaultTemplate(daysLeft: number): ReminderTemplate {
  if (daysLeft < 0) return "expired";
  if (daysLeft <= 1) return "1";
  if (daysLeft <= 3) return "3";
  return "7";
}

export function getReminderMessage(
  customer: Pick<Customer, "fullName" | "expiryDate">,
  template: ReminderTemplate,
): string {
  const name = getFirstName(customer.fullName);
  const date = formatLongDate(customer.expiryDate);
  if (template === "expired") {
    return `Hi ${name}, your TV subscription expired on ${date}. Please renew to get your service back. Thank you!`;
  }
  const left = template === "1" ? "1 day left" : `${template} days left`;
  return `Hi ${name}, your TV subscription expires on ${date} (${left}). Please renew to keep your service running. Thank you!`;
}