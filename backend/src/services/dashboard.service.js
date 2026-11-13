const { Customer, Payment } = require("../models");
const { CURRENCY } = require("../config/business");
const { addMonths, formatDateOnly, startOfMonth } = require("../utils/dates");
const { getToday } = require("../utils/today");
const { getStatusRanges } = require("../utils/status");
const { toCustomerListItem } = require("../serializers/customer.serializer");
const customerService = require("./customer.service");

const LIST_LIMIT = 100;

const roundMoney = (value) => Math.round(value * 100) / 100;

/** Revenue and paid count for the current month (APP_TIMEZONE), unpaid count overall. */
const getPaymentSummary = async (today) => {
  const monthStart = startOfMonth(today);
  const nextMonthStart = addMonths(monthStart, 1);

  const [paidRows, unpaidCount] = await Promise.all([
    Payment.aggregate([
      { $match: { status: "paid", paidAt: { $gte: monthStart, $lt: nextMonthStart } } },
      { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } },
    ]),
    Payment.countDocuments({ status: "unpaid" }),
  ]);

  const paid = paidRows[0] || { total: 0, count: 0 };
  return {
    revenueThisMonth: roundMoney(paid.total),
    currency: CURRENCY,
    paidCount: paid.count,
    unpaidCount,
  };
};

const getDashboardSummary = async () => {
  const today = getToday();
  const ranges = getStatusRanges(today);

  const [stats, expiring, expired, payments] = await Promise.all([
    customerService.getCustomerStats({}),
    Customer.find({ expiresAt: ranges.expiring }).sort({ expiresAt: 1, _id: 1 }).limit(LIST_LIMIT),
    Customer.find({ expiresAt: ranges.expired }).sort({ expiresAt: -1, _id: 1 }).limit(LIST_LIMIT),
    getPaymentSummary(today),
  ]);

  return {
    today: formatDateOnly(today),
    counts: {
      total: stats.total,
      active: stats.active,
      expiring: stats.expiring,
      expired: stats.expired,
    },
    needsAttention: stats.expiring + stats.expired,
    expiring: expiring.map((customer) => toCustomerListItem(customer, today)),
    expired: expired.map((customer) => toCustomerListItem(customer, today)),
    payments,
  };
};

module.exports = {
  getDashboardSummary,
};