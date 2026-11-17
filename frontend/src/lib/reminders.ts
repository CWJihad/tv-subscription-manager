import { formatLongDate, getFirstName } from "@/lib/format";
import { DEFAULT_TEMPLATES, renderTemplate } from "@/lib/settings";
import type { Customer, ReminderTemplates } from "@/types";

export type ReminderTemplate = "7" | "3" | "1" | "expired";

export const REMINDER_TEMPLATES: { value: ReminderTemplate; label: string }[] = [
  { value: "7", label: "7 days left" },
  { value: "3", label: "3 days left" },
  { value: "1", label: "1 day left" },
  { value: "expired", label: "Expired" },
];

/** Pill value -> key in settings.reminderTemplates. */
const TEMPLATE_KEY: Record<ReminderTemplate, keyof ReminderTemplates> = {
  "7": "d7",
  "3": "d3",
  "1": "d1",
  expired: "expired",
};

export function getDefaultTemplate(daysLeft: number): ReminderTemplate {
  if (daysLeft < 0) return "expired";
  if (daysLeft <= 1) return "1";
  if (daysLeft <= 3) return "3";
  return "7";
}

/** Uses the saved templates. Falls back to the backend defaults when they are not loaded. */
export function getReminderMessage(
  customer: Pick<Customer, "fullName" | "expiryDate">,
  template: ReminderTemplate,
  templates: ReminderTemplates = DEFAULT_TEMPLATES,
): string {
  return renderTemplate(
    templates[TEMPLATE_KEY[template]],
    getFirstName(customer.fullName),
    formatLongDate(customer.expiryDate),
  );
}