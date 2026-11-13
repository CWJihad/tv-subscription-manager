const { DateTime } = require("luxon");
const config = require("../config/config");
const { parseDateOnly } = require("./dates");

/** Current time in APP_TIMEZONE (luxon DateTime). Used by the reminder job. */
const getNowInZone = () => DateTime.now().setZone(config.app.timezone);

/** The ONLY place that defines "today": a Date at 00:00:00.000Z. */
const getToday = () => {
  if (config.app.mockToday) return parseDateOnly(config.app.mockToday);
  const now = getNowInZone();
  return new Date(Date.UTC(now.year, now.month - 1, now.day));
};

module.exports = {
  getToday,
  getNowInZone,
};