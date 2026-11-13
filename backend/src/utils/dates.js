const DATE_ONLY_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const MS_PER_DAY = 86_400_000;

const isValidDateOnly = (str) => {
  if (typeof str !== "string") return false;
  const match = DATE_ONLY_RE.exec(str);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
};

/** "YYYY-MM-DD" -> Date at 00:00:00.000Z. Throws on invalid input. */
const parseDateOnly = (str) => {
  if (!isValidDateOnly(str)) throw new Error(`Invalid date: ${str}`);
  return new Date(`${str}T00:00:00.000Z`);
};

/** Date -> "YYYY-MM-DD" (UTC). */
const formatDateOnly = (date) => date.toISOString().slice(0, 10);

const addDays = (date, n) => new Date(date.getTime() + n * MS_PER_DAY);

const daysInMonth = (year, monthIndex) => new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();

/** Adds calendar months; clamps to the last day of the target month. */
const addMonths = (date, n) => {
  const total = date.getUTCMonth() + n;
  const year = date.getUTCFullYear() + Math.floor(total / 12);
  const monthIndex = ((total % 12) + 12) % 12;
  const day = Math.min(date.getUTCDate(), daysInMonth(year, monthIndex));
  return new Date(Date.UTC(year, monthIndex, day));
};

/** Whole calendar days: a minus b. */
const diffDays = (a, b) => Math.round((a.getTime() - b.getTime()) / MS_PER_DAY);

/** First day of the month of `date`, at 00:00:00.000Z. */
const startOfMonth = (date) => new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));

module.exports = {
  parseDateOnly,
  formatDateOnly,
  addDays,
  addMonths,
  diffDays,
  isValidDateOnly,
  startOfMonth,
};