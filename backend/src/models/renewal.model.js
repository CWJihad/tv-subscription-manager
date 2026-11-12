const mongoose = require("mongoose");
const { toJSON, paginate } = require("./plugins");

const renewalSchema = mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer"
    },
    periodStart: {
      type: Date,
    },
    periodEnd: {
      type: Date,
    },
    durationMonth: {
      type: Number,
    },
    type: {
      type: String,
      enum: ['initial', 'renewal']
    },
  },
  {
    timestamps: true,
  },
);

// add plugin that converts mongoose to json
renewalSchema.plugin(toJSON);
renewalSchema.plugin(paginate);

const Renewal = mongoose.model("Renewal", renewalSchema);

module.exports = Renewal;
