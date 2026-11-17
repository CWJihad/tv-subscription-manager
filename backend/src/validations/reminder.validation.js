const Joi = require("joi");
const { objectId } = require("./custom.validation");
const { REMINDER_TYPES, REMINDER_CHANNELS, REMINDER_LOG_STATUSES } = require("../config/business");

const runReminders = {
  query: Joi.object().keys({
    dryRun: Joi.boolean().default(false),
  }),
};

const getLogs = {
  query: Joi.object().keys({
    customerId: Joi.string().custom(objectId),
    status: Joi.string().valid(...REMINDER_LOG_STATUSES),
    type: Joi.string().valid(...REMINDER_TYPES),
    channel: Joi.string().valid(...REMINDER_CHANNELS),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
  }),
};

const getCustomerReminders = {
  params: Joi.object().keys({
    id: Joi.string().custom(objectId).required(),
  }),
};

module.exports = {
  runReminders,
  getLogs,
  getCustomerReminders,
};