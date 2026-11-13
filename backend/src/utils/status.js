const { EXPIRING_WINDOW_DAYS } = require("../config/business");
const { diffDays, addDays } = require("./dates");

/** Active: > 10 days left. Expiring: 0-10. Expired: < 0. */
const getStatus = (expiresAt, today) => {
  const daysLeft = diffDays(expiresAt, today);
  if (daysLeft < 0) return { status: "expired", daysLeft };
  if (daysLeft <= EXPIRING_WINDOW_DAYS) return { status: "expiring", daysLeft };
  return { status: "active", daysLeft };
};

const getExpiringBucket = (daysLeft) => {
  if (daysLeft < 0 || daysLeft > EXPIRING_WINDOW_DAYS) return null;
  if (daysLeft <= 3) return "1-3";
  if (daysLeft <= 7) return "4-7";
  return "8-10";
};

/** `expiresAt` query conditions, e.g. Customer.countDocuments({ expiresAt: ranges.active }). */
const getStatusRanges = (today) => {
  const end = addDays(today, EXPIRING_WINDOW_DAYS);
  return {
    active: { $gt: end },
    expiring: { $gte: today, $lte: end },
    expired: { $lt: today },
    buckets: {
      "1-3": { $gte: today, $lte: addDays(today, 3) },
      "4-7": { $gte: addDays(today, 4), $lte: addDays(today, 7) },
      "8-10": { $gte: addDays(today, 8), $lte: end },
    },
  };
};

module.exports = {
  getStatus,
  getExpiringBucket,
  getStatusRanges,
};