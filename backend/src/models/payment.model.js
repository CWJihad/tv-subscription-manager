const mongoose = require("mongoose");
const { toJSON, paginate } = require("./plugins");
const {
  CURRENCY,
  PAYMENT_METHODS,
  PAYMENT_STATUSES,
} = require("../config/business");
const { isValidMoney } = require("../utils/money");

const paymentSchema = mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
      index: true,
    },
    renewalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Renewal",
      required: true,
      unique: true,
    }, // one payment per renewal
    amount: {
      type: Number,
      required: true,
      min: 0,
      validate: {
        validator: isValidMoney,
        message: "Amount must have at most 2 decimals",
      },
    },
    currency: { type: String, default: CURRENCY },
    method: { type: String, enum: [...PAYMENT_METHODS, null], default: null }, // null when unpaid
    status: { type: String, enum: [...PAYMENT_STATUSES], required: true },
    paidAt: { type: Date, default: null }, // date-only; required when paid (enforced in service)
    note: { type: String, trim: true, maxlength: 200, default: null },
  },
  { timestamps: true },
);

paymentSchema.plugin(toJSON);
paymentSchema.plugin(paginate);

module.exports = mongoose.model("Payment", paymentSchema);
