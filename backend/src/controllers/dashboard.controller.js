const httpStatus = require("http-status");
const catchAsync = require("../utils/catchAsync");
const response = require("../config/response");
const { dashboardService } = require("../services");

const getSummary = catchAsync(async (req, res) => {
  const data = await dashboardService.getDashboardSummary();
  res.status(httpStatus.OK).json(
    response({ message: "Dashboard summary", statusCode: httpStatus.OK, type: "dashboard", data })
  );
});

module.exports = {
  getSummary,
};