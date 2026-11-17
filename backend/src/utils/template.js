const { DateTime } = require("luxon");

/** First word of the full name. */
const getFirstName = (fullName) => String(fullName || "").trim().split(/\s+/)[0] || "";

/** Date (00:00Z) -> "Oct 8, 2026". */
const formatMessageDate = (date) =>
  DateTime.fromJSDate(date, { zone: "utc" }).setLocale("en-US").toFormat("LLL d, yyyy");

/** Fills {firstName} and {date}. Function replacers keep "$" in names safe. */
const renderTemplate = (template, { firstName, date }) =>
  String(template)
    .replace(/\{firstName\}/g, () => firstName)
    .replace(/\{date\}/g, () => date);

module.exports = { getFirstName, formatMessageDate, renderTemplate };