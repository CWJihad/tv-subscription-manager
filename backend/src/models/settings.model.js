const mongoose = require("mongoose");
const { toJSON } = require("./plugins");
const {
  REMINDER_CHANNELS,
  DEFAULT_REMINDER_TEMPLATES,
} = require("../config/business");
const { isValidMoney } = require("../utils/money");

const template = (key) => ({
  type: String,
  trim: true,
  maxlength: 500,
  default: DEFAULT_REMINDER_TEMPLATES[key],
});
const price = {
  type: Number,
  min: 0,
  default: null,
  validate: { validator: isValidMoney, message: "Invalid price" },
};

const settingsSchema = mongoose.Schema(
  {
    key: { type: String, default: "main", unique: true, immutable: true }, // single document
    remind7Days: { type: Boolean, default: true },
    remind3Days: { type: Boolean, default: true },
    remind1Day: { type: Boolean, default: true },
    remindExpired: { type: Boolean, default: true },
    reminderChannels: {
      type: [{ type: String, enum: [...REMINDER_CHANNELS] }],
      default: () => [...REMINDER_CHANNELS],
    },
    reminderSendHour: {
      type: Number,
      min: 0,
      max: 23,
      default: 9,
      validate: {
        validator: Number.isInteger,
        message: "reminderSendHour must be an integer",
      },
    },
    reminderTemplates: {
      d7: template("d7"),
      d3: template("d3"),
      d1: template("d1"),
      expired: template("expired"),
    },
    prices: { m3: price, m6: price, m12: price },
  },
  { timestamps: true },
);

settingsSchema.plugin(toJSON);

module.exports = mongoose.model("Settings", settingsSchema);
