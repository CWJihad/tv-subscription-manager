const config = require("../config/config");
const { CURRENCY, EXPIRING_WINDOW_DAYS } = require("../config/business");
const { formatDateOnly } = require("../utils/dates");
const { getToday } = require("../utils/today");

const getMeta = () => ({
  today: formatDateOnly(getToday()),
  timezone: config.app.timezone,
  currency: CURRENCY,
  expiringWindowDays: EXPIRING_WINDOW_DAYS,
});

module.exports = {
  getMeta,
};