const Joi = require("joi");
const { objectId, dateOnly } = require("./custom.validation");
const { paymentInput } = require("./payment.validation");
const { DURATION_OPTIONS } = require("../config/business");

const fullName = Joi.string().trim().min(2).max(80);
const phone = Joi.string().trim().max(30);
const email = Joi.string().trim().lowercase().email({ tlds: { allow: false } }).allow("", null);

const idParams = Joi.object().keys({
  id: Joi.string().custom(objectId).required(),
});

const getCustomers = {
  query: Joi.object().keys({
    status: Joi.string().valid("all", "active", "expiring", "expired").default("all"),
    bucket: Joi.string().valid("1-3", "4-7", "8-10"), // used only with status=expiring
    q: Joi.string().trim().max(100).allow(""),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    sort: Joi.string().valid("name", "-name", "expiry", "-expiry", "since", "-since"),
  }),
};

const getCustomerStats = {
  query: Joi.object().keys({
    q: Joi.string().trim().max(100).allow(""),
  }),
};

const getCustomer = {
  params: idParams,
};

const createCustomer = {
  body: Joi.object().keys({
    fullName: fullName.required(),
    phone: phone.required(),
    email,
    startDate: Joi.string().custom(dateOnly),
    durationMonths: Joi.number()
      .valid(...DURATION_OPTIONS)
      .required(),
    payment: paymentInput,
  }),
};

const updateCustomer = {
  params: idParams,
  body: Joi.object()
    .keys({
      fullName,
      phone,
      email,
      remindersEnabled: Joi.boolean(),
    })
    .min(1),
};

const deleteCustomer = {
  params: idParams,
};

const renewCustomer = {
  params: idParams,
  body: Joi.object().keys({
    durationMonths: Joi.number()
      .valid(...DURATION_OPTIONS)
      .required(),
    payment: paymentInput,
  }),
};

module.exports = {
  getCustomers,
  getCustomerStats,
  getCustomer,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  renewCustomer,
};