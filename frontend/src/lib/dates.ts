// pure UTC date math: parse, format, addMonths (clamped), diffInDays

const ISO_DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const MS_PER_DAY = 86_400_000;

function tryParseISODate(iso: string): Date | null {
  const match = ISO_DATE_RE.exec(iso);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  const isSameDate =
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day;
  return isSameDate ? date : null;
}

export function isValidISODate(iso: string): boolean {
  return tryParseISODate(iso) !== null;
}

/** Parses YYYY-MM-DD as a UTC date. Throws on invalid input. */
export function parseISODate(iso: string): Date {
  const date = tryParseISODate(iso);
  if (!date) throw new Error(`Invalid ISO date: ${iso}`);
  return date;
}

export function toISODate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function daysInMonth(year: number, monthIndex: number): number {
  return new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
}

/** Adds calendar months. If the day does not exist in the target month, uses the last day of it. */
export function addMonths(iso: string, months: number): string {
  const date = parseISODate(iso);
  const total = date.getUTCMonth() + months;
  const year = date.getUTCFullYear() + Math.floor(total / 12);
  const monthIndex = ((total % 12) + 12) % 12;
  const day = Math.min(date.getUTCDate(), daysInMonth(year, monthIndex));
  return toISODate(new Date(Date.UTC(year, monthIndex, day)));
}

/** Whole calendar days from `from` to `to`. Negative when `to` is before `from`. */
export function diffInDays(from: string, to: string): number {
  return Math.round((parseISODate(to).getTime() - parseISODate(from).getTime()) / MS_PER_DAY);
}