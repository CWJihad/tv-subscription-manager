const httpStatus = require("http-status");
const catchAsync = require("../utils/catchAsync");
const response = require("../config/response");
const { paymentService } = require("../services");

const listPayments = catchAsync(async (req, res) => {
  const data = await paymentService.listPayments(req.query);
  res.status(httpStatus.OK).json(
    response({ message: "Payments", statusCode: httpStatus.OK, type: "payment", data })
  );
});

module.exports = {
  listPayments,
};