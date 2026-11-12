const httpStatus = require("http-status");
const catchAsync = require("../utils/catchAsync");
const response = require("../config/response");

const getHealth = catchAsync(async (req, res) => {
  res.status(httpStatus.OK).json(
    response({
      message: "OK",
      statusCode: httpStatus.OK,
      type: "health",
      data: { status: "ok" },
    })
  );
});

module.exports = {
  getHealth,
};