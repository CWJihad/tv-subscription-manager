const httpStatus = require("http-status");
const escapeRegExp = require("lodash/escapeRegExp");
const { Customer, Renewal, Payment, ReminderLog } = require("../models");
const ApiError = require("../utils/ApiError");
const { normalizePhone } = require("../utils/phone");
const { parseDateOnly } = require("../utils/dates");
const { getToday } = require("../utils/today");
const { getStatusRanges } = require("../utils/status");
const { calcExpiry, getRenewalBase } = require("../utils/subscription");
const {
  toCustomerListItem,
  toCustomerDetail,
} = require("../serializers/customer.serializer");
const paymentService = require("./payment.service");

const SORT_OPTIONS = {
  name: "fullName:asc",
  "-name": "fullName:desc",
  expiry: "expiresAt:asc",
  "-expiry": "expiresAt:desc",
  since: "createdAt:asc",
  "-since": "createdAt:desc",
};

const SUBSCRIPTION_CHANGED = "Subscription was changed. Refresh and try again.";

const isPhoneDuplicate = (error) =>
  Boolean(error) &&
  error.code === 11000 &&
  Boolean(error.keyPattern && error.keyPattern.phone);

const phoneExists = () =>
  new ApiError(httpStatus.CONFLICT, "Phone number already exists");

const findCustomerOrThrow = async (id) => {
  const customer = await Customer.findById(id);
  if (!customer) {
    throw new ApiError(httpStatus.NOT_FOUND, "Customer not found");
  }
  return customer;
};

const assertPhoneAvailable = async (phone, excludeId) => {
  const filter = { phone };
  if (excludeId) filter._id = { $ne: excludeId };
  if (await Customer.exists(filter)) throw phoneExists();
};

const buildDetail = async (customer, today) => {
  const [renewals, payments] = await Promise.all([
    Renewal.find({ customerId: customer._id }).lean(),
    Payment.find({ customerId: customer._id }).lean(),
  ]);
  return toCustomerDetail(customer, renewals, payments, today);
};

/** Case-insensitive match on name, phone or email. Input is escaped. */
const buildSearchFilter = (q) => {
  const term = typeof q === "string" ? q.trim() : "";
  if (!term) return {};
  const regex = new RegExp(escapeRegExp(term), "i");
  return { $or: [{ fullName: regex }, { phone: regex }, { email: regex }] };
};

const buildListFilter = ({ status, bucket, q }, today) => {
  const ranges = getStatusRanges(today);
  const filter = buildSearchFilter(q);
  if (status === "active" || status === "expired") {
    filter.expiresAt = ranges[status];
  } else if (status === "expiring") {
    filter.expiresAt = bucket ? ranges.buckets[bucket] : ranges.expiring;
  }
  return filter;
};

const getSortBy = ({ status, sort }) => {
  let base;
  if (sort) base = SORT_OPTIONS[sort];
  else if (status === "expiring") base = "expiresAt:asc";
  else if (status === "expired") base = "expiresAt:desc";
  else base = "_id:asc";
  return base.startsWith("_id") ? base : `${base},_id:asc`;
};

const listCustomers = async (query) => {
  const today = getToday();
  const filter = buildListFilter(query, today);
  const result = await Customer.paginate(filter, {
    sortBy: getSortBy(query),
    page: query.page,
    limit: query.limit,
  });
  return {
    ...result,
    results: result.results.map((customer) =>
      toCustomerListItem(customer, today),
    ),
  };
};

const getCustomerStats = async ({ q } = {}) => {
  const today = getToday();
  const ranges = getStatusRanges(today);
  const base = buildSearchFilter(q);
  const count = (expiresAt) =>
    Customer.countDocuments(expiresAt ? { ...base, expiresAt } : base);

  const [total, active, expiring, expired, b13, b47, b810] = await Promise.all([
    count(),
    count(ranges.active),
    count(ranges.expiring),
    count(ranges.expired),
    count(ranges.buckets["1-3"]),
    count(ranges.buckets["4-7"]),
    count(ranges.buckets["8-10"]),
  ]);

  return {
    total,
    active,
    expiring,
    expired,
    expiringBuckets: { "1-3": b13, "4-7": b47, "8-10": b810 },
  };
};

const getCustomerById = async (id) => {
  const customer = await findCustomerOrThrow(id);
  return buildDetail(customer, getToday());
};

const createCustomer = async (body) => {
  const today = getToday();
  const phone = normalizePhone(body.phone);
  await assertPhoneAvailable(phone);

  const startDate = body.startDate ? parseDateOnly(body.startDate) : today;
  const expiresAt = calcExpiry(startDate, body.durationMonths);
  // Validate the payment before anything is written.
  const paymentFields = body.payment
    ? paymentService.buildPaymentFields(body.payment, today)
    : null;

  let customer;
  try {
    customer = await Customer.create({
      fullName: body.fullName,
      phone,
      email: body.email,
      startDate,
      durationMonths: body.durationMonths,
      expiresAt,
      createdAt: startDate, // customerSince = start date
    });
  } catch (error) {
    if (isPhoneDuplicate(error)) throw phoneExists();
    throw error;
  }

  try {
    const renewal = await Renewal.create({
      customerId: customer._id,
      type: "initial",
      periodStart: startDate,
      periodEnd: expiresAt,
      durationMonths: body.durationMonths,
    });
    if (paymentFields) {
      await paymentService.createPayment(
        customer._id,
        renewal._id,
        paymentFields,
      );
    }
  } catch (error) {
    // No transactions (D9): undo what was created, then rethrow.
    await Promise.allSettled([
      Payment.deleteMany({ customerId: customer._id }),
      Renewal.deleteMany({ customerId: customer._id }),
      Customer.deleteOne({ _id: customer._id }),
    ]);
    throw error;
  }

  return buildDetail(customer, today);
};

/** Only name, email, phone and remindersEnabled. Dates are never touched here. */
const updateCustomer = async (id, body) => {
  const customer = await findCustomerOrThrow(id);
  const updates = {};

  if (body.fullName !== undefined) updates.fullName = body.fullName;
  if (body.email !== undefined) updates.email = body.email;
  if (body.remindersEnabled !== undefined)
    updates.remindersEnabled = body.remindersEnabled;
  if (body.phone !== undefined) {
    const phone = normalizePhone(body.phone);
    if (phone !== customer.phone) {
      await assertPhoneAvailable(phone, customer._id);
      updates.phone = phone;
    }
  }

  customer.set(updates);
  try {
    await customer.save();
  } catch (error) {
    if (isPhoneDuplicate(error)) throw phoneExists();
    throw error;
  }
  return buildDetail(customer, getToday());
};

/**
 * D6: newExpiry = max(currentExpiry, today) + months.
 * Conditional update on the old expiresAt (D9): a parallel renew or a delete gives 409.
 */
const renewCustomer = async (id, body) => {
  const customer = await findCustomerOrThrow(id);
  const today = getToday();
  // Validate the payment before anything is written.
  const paymentFields = body.payment
    ? paymentService.buildPaymentFields(body.payment, today)
    : null;

  const previous = {
    startDate: customer.startDate,
    durationMonths: customer.durationMonths,
    expiresAt: customer.expiresAt,
  };
  const base = getRenewalBase(previous.expiresAt, today);
  const newExpiry = calcExpiry(base, body.durationMonths);

  const updated = await Customer.findOneAndUpdate(
    { _id: customer._id, expiresAt: previous.expiresAt },
    {
      $set: {
        startDate: base,
        durationMonths: body.durationMonths,
        expiresAt: newExpiry,
      },
    },
    { new: true },
  );
  if (!updated) {
    throw new ApiError(httpStatus.CONFLICT, SUBSCRIPTION_CHANGED);
  }

  let renewal;
  try {
    renewal = await Renewal.create({
      customerId: customer._id,
      type: "renewal",
      periodStart: base,
      periodEnd: newExpiry,
      durationMonths: body.durationMonths,
    });
    if (paymentFields) {
      await paymentService.createPayment(
        customer._id,
        renewal._id,
        paymentFields,
      );
    }
  } catch (error) {
    // No transactions (D9): restore the old period (only if still ours), delete what was created.
    const cleanup = [
      Customer.updateOne(
        { _id: customer._id, expiresAt: newExpiry },
        { $set: previous },
      ),
    ];
    if (renewal) {
      cleanup.push(
        Payment.deleteOne({ renewalId: renewal._id }),
        Renewal.deleteOne({ _id: renewal._id }),
      );
    }
    await Promise.allSettled(cleanup);
    throw error;
  }

  return buildDetail(updated, today);
};

const deleteCustomer = async (id) => {
  const customer = await findCustomerOrThrow(id);
  await Customer.deleteOne({ _id: customer._id });
  await Promise.all([
    Renewal.deleteMany({ customerId: customer._id }),
    Payment.deleteMany({ customerId: customer._id }),
    ReminderLog.deleteMany({ customerId: customer._id }),
  ]);
  return { id: String(customer._id) };
};

module.exports = {
  listCustomers,
  getCustomerStats,
  getCustomerById,
  createCustomer,
  updateCustomer,
  renewCustomer,
  deleteCustomer,
};
