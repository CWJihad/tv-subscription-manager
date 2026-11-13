/** Money: finite number >= 0 with at most 2 decimals. null/undefined allowed (use `required` separately). */
const isValidMoney = (value) =>
  value === null || value === undefined || (Number.isFinite(value) && value >= 0 && Math.round(value * 100) / 100 === value);

module.exports = { isValidMoney };