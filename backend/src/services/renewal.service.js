const httpStatus = require("http-status");
const { Customer, Renewal } = require("../models");
const ApiError = require("../utils/ApiError");
const { calcExpiry } = require("../utils/subscription");
const { parseDateOnly } = require("../utils/dates");
const { getToday } = require("../utils/today");

const createRenewal = async (renewalBody) => {
  const today = getToday()
  const periodStart = renewalBody.periodStart
    ? parseDateOnly(renewalBody.periodStart)
    : today;
  const expiresAt = calcExpiry(periodStart, renewalBody.durationMonths);

  try {
    const customer = await Customer.findById(renewalBody.customerId);
    if (!customer) {
      throw new ApiError(httpStatus.NOT_FOUND, "Customer not found");
    }

    const renewal = await Renewal.create({
      customerId: customer._id,
      type: "initial",
      periodStart,
      periodEnd: expiresAt,
      durationMonths: renewalBody.durationMonths,
    });

    return renewal
    
  } catch (error) {

    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Can't customer renewal");

  }

};

const extendRenewal = async (extendRenewalBody) => {
  const {customerId, durationMonths} = extendRenewalBody
  const customer = await Customer.findById(customerId);

  const expiresAt = customer.expiresAt
  const oldExpiry = expiresAt

  const newExpiry = calcExpiry(oldExpiry, durationMonths);


  try {
    const updated = await Customer.findOneAndUpdate(
      { _id: customer._id },
      {
        $set: {
          startDate: oldExpiry,
          durationMonths,
          expiresAt: newExpiry,
        },
      },
      { new: true },
    );
    
    if (!updated) {
      throw new ApiError(httpStatus.CONFLICT, SUBSCRIPTION_CHANGED);
    }

    return updated;

  } catch (error) {
    
  }

  let renewal;
  try {
    renewal = await Renewal.create({
      customerId: customer._id,
      type: "renewal",
      periodStart: oldExpiry,
      periodEnd: newExpiry,
      durationMonths,
    });
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error.message)
  }

};

module.exports = {
  createRenewal,
  extendRenewal
};
