const httpStatus = require("http-status");
const catchAsync = require("../utils/catchAsync");
const response = require("../config/response");
const { customerService } = require("../services");

const createCustomer = catchAsync(async (req, res) => {
  const customer = await customerService.createCustomer(req.body);
  res.status(httpStatus.CREATED).json(
    response({
      message: "customer Created",
      status: "OK",
      statusCode: httpStatus.CREATED,
      data: customer,
    })
  );
});

module.exports = {
  createCustomer
};