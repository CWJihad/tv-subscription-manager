const mongoose = require("mongoose");
const validator = require("validator");
const { toJSON, paginate } = require("./plugins");
const { DURATION_OPTIONS } = require("../config/business");

const normalizeEmail = (value) =>
  typeof value === "string" && value.trim() ? value.trim().toLowerCase() : null;

const customerSchema = mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 80,
    },
    phone: { type: String, required: true, unique: true, trim: true }, // normalized E.164
    email: {
      type: String,
      default: null,
      set: normalizeEmail,
      validate: {
        validator: (value) => !value || validator.isEmail(value),
        message: "Invalid email",
      },
    },
    startDate: { type: Date, required: true }, // start of the CURRENT period
    durationMonths: {
      type: Number,
      enum: [...DURATION_OPTIONS],
      required: true,
    }, // CURRENT period
    expiresAt: { type: Date, required: true, index: true },
    remindersEnabled: { type: Boolean, default: true },
  },
  { timestamps: true },
);

customerSchema.plugin(toJSON);
customerSchema.plugin(paginate);

module.exports = mongoose.model("Customer", customerSchema);
