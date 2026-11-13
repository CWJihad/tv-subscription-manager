const mongoose = require("mongoose");
const { toJSON, paginate } = require("./plugins");
const { DURATION_OPTIONS, RENEWAL_TYPES } = require("../config/business");

const renewalSchema = mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
      index: true,
    },
    type: { type: String, enum: [...RENEWAL_TYPES], required: true },
    periodStart: { type: Date, required: true },
    periodEnd: { type: Date, required: true },
    durationMonths: {
      type: Number,
      enum: [...DURATION_OPTIONS],
      required: true,
    },
  },
  { timestamps: true },
);

renewalSchema.index({ customerId: 1, periodStart: 1 });

renewalSchema.plugin(toJSON);
renewalSchema.plugin(paginate);

module.exports = mongoose.model("Renewal", renewalSchema);
