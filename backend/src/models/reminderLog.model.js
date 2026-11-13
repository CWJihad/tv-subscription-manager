const mongoose = require("mongoose");
const { toJSON, paginate } = require("./plugins");
const {
  REMINDER_TYPES,
  REMINDER_CHANNELS,
  REMINDER_PROVIDERS,
  REMINDER_LOG_STATUSES,
} = require("../config/business");

const reminderLogSchema = mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
      index: true,
    },
    periodEnd: { type: Date, required: true },
    type: { type: String, enum: [...REMINDER_TYPES], required: true },
    channel: { type: String, enum: [...REMINDER_CHANNELS], required: true },
    provider: { type: String, enum: [...REMINDER_PROVIDERS], required: true },
    status: { type: String, enum: [...REMINDER_LOG_STATUSES], required: true },
    attempts: { type: Number, default: 0 },
    reason: { type: String, default: null },
    error: { type: String, default: null },
    providerMessageId: { type: String, default: null },
    sentAt: { type: Date, default: null },
    to: { type: String, default: null }, // masked
  },
  { timestamps: true },
);

reminderLogSchema.index(
  { customerId: 1, periodEnd: 1, type: 1, channel: 1 },
  { unique: true },
);

reminderLogSchema.plugin(toJSON);
reminderLogSchema.plugin(paginate);

module.exports = mongoose.model("ReminderLog", reminderLogSchema);
