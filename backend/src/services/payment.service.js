const httpStatus = require("http-status");
const { Payment, Customer, Renewal } = require("../models");
const ApiError = require("../utils/ApiError");
const { parseDateOnly } = require("../utils/dates");
const { getToday } = require("../utils/today");
const { CURRENCY } = require("../config/business");
const { toRenewalItem, toPaymentListItem } = require("../serializers/customer.serializer");

const isDuplicateKey = (error) => Boolean(error) && error.code === 11000;

/**
 * Validates the business rules and returns the Payment fields (without ids).
 * paid: amount > 0, method required, paidAt defaults to today.
 * unpaid: no method, no paidAt.
 */
const buildPaymentFields = (payment, today) => {
  const status = payment.status || "paid";
  const note = payment.note || null;

  if (status === "paid") {
    if (!(payment.amount > 0)) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Amount must be greater than 0 for a paid payment");
    }
    if (!payment.method) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Payment method is required for a paid payment");
    }
    return {
      amount: payment.amount,
      currency: CURRENCY,
      method: payment.method,
      status: "paid",
      paidAt: payment.paidAt ? parseDateOnly(payment.paidAt) : today,
      note,
    };
  }

  return {
    amount: payment.amount,
    currency: CURRENCY,
    method: null,
    status: "unpaid",
    paidAt: null,
    note,
  };
};

const createPayment = async (customerId, renewalId, fields) => Payment.create({ customerId, renewalId, ...fields });

const saveByRenewal = (customerId, renewalId, fields) =>
  Payment.findOneAndUpdate(
    { renewalId },
    { $set: { customerId, ...fields } },
    { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
  );

/** One payment per renewal. Creates or replaces it. Returns the renewal item with its payment. */
const upsertPayment = async (customerId, renewalId, body) => {
  if (!(await Customer.exists({ _id: customerId }))) {
    throw new ApiError(httpStatus.NOT_FOUND, "Customer not found");
  }
  const renewal = await Renewal.findOne({ _id: renewalId, customerId });
  if (!renewal) {
    throw new ApiError(httpStatus.NOT_FOUND, "Renewal not found");
  }

  const fields = buildPaymentFields(body, getToday());

  let payment;
  try {
    payment = await saveByRenewal(customerId, renewal._id, fields);
  } catch (error) {
    if (!isDuplicateKey(error)) throw error;
    // Two parallel upserts raced on the unique renewalId index: the second one now updates.
    payment = await saveByRenewal(customerId, renewal._id, fields);
  }
  return toRenewalItem(renewal, payment);
};

const listPayments = async ({ status, from, to, page, limit }) => {
  if (from && to && from > to) {
    throw new ApiError(httpStatus.BAD_REQUEST, '"from" must not be after "to"');
  }
  const filter = {};
  if (status) filter.status = status;
  if (from || to) {
    filter.paidAt = {};
    if (from) filter.paidAt.$gte = parseDateOnly(from);
    if (to) filter.paidAt.$lte = parseDateOnly(to);
  }

  const result = await Payment.paginate(filter, {
    sortBy: "paidAt:desc,_id:desc",
    page,
    limit,
    populate: "customerId fullName",
  });
  return {
    ...result,
    results: result.results.map(toPaymentListItem),
  };
};

module.exports = {
  buildPaymentFields,
  createPayment,
  upsertPayment,
  listPayments,
};