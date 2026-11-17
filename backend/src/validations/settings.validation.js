const Joi = require("joi");
const { money } = require("./custom.validation");
const { REMINDER_CHANNELS, REMINDER_STRATEGIES } = require("../config/business");

const ALLOWED_PLACEHOLDERS = ["firstName", "date"];

/** Only {firstName} and {date} are allowed as placeholders. */
const templateText = (value, helpers) => {
  const found = value.match(/\{[^}]*\}/g) || [];
  const unknown = found.filter((token) => !ALLOWED_PLACEHOLDERS.includes(token.slice(1, -1)));
  if (unknown.length) {
    return helpers.message(`"{{#label}}" has unknown placeholder ${unknown[0]}. Use {firstName} and {date}`);
  }
  return value;
};

const template = Joi.string().trim().min(1).max(500).custom(templateText);
const price = Joi.number().min(0).allow(null).custom(money);

const updateSettings = {
  body: Joi.object()
    .keys({
      remind7Days: Joi.boolean(),
      remind3Days: Joi.boolean(),
      remind1Day: Joi.boolean(),
      remindExpired: Joi.boolean(),
      reminderChannels: Joi.array()
        .items(Joi.string().valid(...REMINDER_CHANNELS))
        .unique(),
      reminderStrategy: Joi.string().valid(...REMINDER_STRATEGIES),
      reminderSendHour: Joi.number().integer().min(0).max(23),
      reminderTemplates: Joi.object()
        .keys({ d7: template, d3: template, d1: template, expired: template })
        .min(1),
      prices: Joi.object().keys({ m3: price, m6: price, m12: price }).min(1),
      failureDigestEnabled: Joi.boolean(),
    })
    .min(1),
};

module.exports = {
  updateSettings,
};