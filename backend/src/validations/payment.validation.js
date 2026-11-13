const Joi = require("joi");
const { objectId, dateOnly, money } = require("./custom.validation");
const { PAYMENT_METHODS, PAYMENT_STATUSES } = require("../config/business");

// Business rules (paid needs amount > 0, method, paidAt) are enforced in payment.service.
const paymentInput = Joi.object().keys({
  amount: Joi.number().min(0).required().custom(money),
  method: Joi.string()
    .valid(...PAYMENT_METHODS)
    .allow("", null),
  status: Joi.string()
    .valid(...PAYMENT_STATUSES)
    .default("paid"),
  paidAt: Joi.string().custom(dateOnly).allow(null),
  note: Joi.string().trim().max(200).allow("", null),
});

const upsertPayment = {
  params: Joi.object().keys({
    id: Joi.string().custom(objectId).required(),
    renewalId: Joi.string().custom(objectId).required(),
  }),
  body: paymentInput,
};

const getPayments = {
  query: Joi.object().keys({
    status: Joi.string().valid(...PAYMENT_STATUSES),
    from: Joi.string().custom(dateOnly), // filters paidAt
    to: Joi.string().custom(dateOnly), // filters paidAt
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
  }),
};

module.exports = {
  paymentInput,
  upsertPayment,
  getPayments,
};