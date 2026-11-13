const httpStatus = require("http-status");
const catchAsync = require("../utils/catchAsync");
const response = require("../config/response");
const { metaService } = require("../services");

const getMeta = catchAsync(async (req, res) => {
  const data = metaService.getMeta();
  res.status(httpStatus.OK).json(
    response({ message: "Meta", statusCode: httpStatus.OK, type: "meta", data })
  );
});

module.exports = {
  getMeta,
};