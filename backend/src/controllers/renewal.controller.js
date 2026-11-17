const httpStatus = require("http-status");
const { renewalService } = require("../services");
const response = require("../config/response");
const catchAsync = require("../utils/catchAsync");

const createRenewal = catchAsync(async (req, res) => {
  const data = await renewalService.createRenewal(req.body);
  res.status(httpStatus.OK).json(
    response({ message: "Renewal Created Successfully", statusCode: httpStatus.OK, data })
  );
});

const extendRenewal =  catchAsync(async (req, res) => {
  const data = await renewalService.extendRenewal(req.body);
  res.status(httpStatus.OK).json(
    response({ message: "Renewal Extended Successfully", statusCode: httpStatus.OK, data })
  );
}); 

module.exports = {
  createRenewal,
  extendRenewal
};