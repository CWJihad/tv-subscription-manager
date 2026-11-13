const { addMonths } = require("./dates");

/** D6: renewal starts at the later of current expiry and today. One function to change if reversed. */
const getRenewalBase = (currentExpiry, today) => (currentExpiry.getTime() > today.getTime() ? currentExpiry : today);

const calcExpiry = (start, months) => addMonths(start, months);

module.exports = {
  getRenewalBase,
  calcExpiry,
};