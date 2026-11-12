const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const { toJSON, paginate } = require("./plugins");

const customerSchema = mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
      default: null,
    },
    phone: {
        type: String,
        required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      validate(value) {
        if (!validator.isEmail(value)) {
          throw new Error("Invalid email");
        }
      },
    },
    password: {
      type: String,
      required: false,
      trim: true,
      minlength: 8,
      validate(value) {
        if (!value.match(/\d/) || !value.match(/[a-zA-Z]/)) {
          throw new Error(
            "Password must contain at least one letter and one number"
          );
        }
      },
      private: true,
    },
    startDate: {
        type: Date,
        required: false,
        default: null
    },
    durationMonths: {
        type: Number,
        required: false,
        default: null
    },
    expiredAt: {
        type: Date,
        required: false,
        default: null
    },
    isDeleted: {
      type: Boolean,
      default: false
    }
    },
  {
    timestamps: true,
  }
);

// add plugin that converts mongoose to json
customerSchema.plugin(toJSON);
customerSchema.plugin(paginate);

customerSchema.statics.isEmailTaken = async function (email, excludeUserId) {
  const customer = await this.findOne({ email, _id: { $ne: excludeUserId } });
  return !!customer;
};

customerSchema.methods.isPasswordMatch = async function (password) {
  const customer = this;
  return bcrypt.compare(password, customer.password);
};

customerSchema.pre("save", async function (next) {
  const customer = this;
  if (customer.isModified("password")) {
    customer.password = await bcrypt.hash(customer.password, 8);
  }
  next();
});

const Customer = mongoose.model("Customer", customerSchema);

module.exports = Customer;
