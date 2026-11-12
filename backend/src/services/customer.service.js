const httpStatus = require("http-status");
const { Customer } = require("../models");
const ApiError = require("../utils/ApiError");

const createCustomer = async (userBody) => {
  if (await Customer.isEmailTaken(userBody.email)) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Email already taken");
  }

  return Customer.create({ ...userBody });

};

module.exports = {
  createCustomer
};