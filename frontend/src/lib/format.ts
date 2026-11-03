// labels and date formats (all formats from project-context.md)

import { parseISODate } from "@/lib/dates";
import type { DurationMonths, SubscriptionStatus } from "@/types";

const OPTIONS_BASE = { timeZone: "UTC" } as const;

const longFormat = new Intl.DateTimeFormat("en-US", {
  ...OPTIONS_BASE,
  month: "short",
  day: "numeric",
  year: "numeric",
});
const shortFormat = new Intl.DateTimeFormat("en-US", {
  ...OPTIONS_BASE,
  month: "short",
  day: "numeric",
});
const fullWithWeekdayFormat = new Intl.DateTimeFormat("en-US", {
  ...OPTIONS_BASE,
  weekday: "long",
  month: "long",
  day: "numeric",
  year: "numeric",
});
const fullMonthFormat = new Intl.DateTimeFormat("en-US", {
  ...OPTIONS_BASE,
  month: "long",
  day: "numeric",
  year: "numeric",
});

/** Oct 8, 2026 */
export function formatLongDate(iso: string): string {
  return longFormat.format(parseISODate(iso));
}

/** Oct 8 */
export function formatShortDate(iso: string): string {
  return shortFormat.format(parseISODate(iso));
}

/** Monday, October 5, 2026 */
export function formatFullDate(iso: string): string {
  return fullWithWeekdayFormat.format(parseISODate(iso));
}

/** October 5, 2026 (Add Customer date field) */
export function formatFullMonthDate(iso: string): string {
  return fullMonthFormat.format(parseISODate(iso));
}

/** Table "Expires" column: "Oct 8" in the same year as today, otherwise "Jan 5, 2027". */
export function formatTableDate(iso: string, today: string): string {
  return iso.slice(0, 4) === today.slice(0, 4) ? formatShortDate(iso) : formatLongDate(iso);
}

function pluralDays(count: number): string {
  return `${count} ${count === 1 ? "day" : "days"}`;
}

/** "3 days left", "1 day left", "Expires today", "2 days ago", "1 day ago" */
export function getRemainingLabel(daysLeft: number): string {
  if (daysLeft > 0) return `${pluralDays(daysLeft)} left`;
  if (daysLeft === 0) return "Expires today";
  return `${pluralDays(Math.abs(daysLeft))} ago`;
}

/** Table status pill text: "Active" for healthy subscriptions, otherwise the remaining label. */
export function getStatusLabel(status: SubscriptionStatus, daysLeft: number): string {
  return status === "active" ? "Active" : getRemainingLabel(daysLeft);
}

/** Dashboard list: "Expired 2 days ago" */
export function getExpiredAgoLabel(daysLeft: number): string {
  return `Expired ${getRemainingLabel(daysLeft)}`;
}

/** "3 months" */
export function formatDuration(months: DurationMonths): string {
  return `${months} months`;
}

/** "3 mo" */
export function formatDurationShort(months: DurationMonths): string {
  return `${months} mo`;
}

export function getInitials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  const first = parts.at(0)?.charAt(0) ?? "";
  const last = parts.length > 1 ? (parts.at(-1)?.charAt(0) ?? "") : "";
  return (first + last).toUpperCase();
}

export function getFirstName(fullName: string): string {
  return fullName.trim().split(/\s+/).at(0) ?? "";
}