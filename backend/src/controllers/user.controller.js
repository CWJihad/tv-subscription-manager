const httpStatus = require("http-status");
const pick = require("../utils/pick");
const catchAsync = require("../utils/catchAsync");
const response = require("../config/response");
const { userService } = require("../services");

const SELF_FIELDS = ["id", "fullName", "email"];

const getProfile = catchAsync(async (req, res) => {
  res.status(httpStatus.OK).json(
    response({
      message: "User profile",
      statusCode: httpStatus.OK,
      type: "user",
      data: pick(req.user.toJSON(), SELF_FIELDS),
    })
  );
});

const updateProfile = catchAsync(async (req, res) => {
  const user = await userService.updateUserById(req.user.id, req.body);
  res.status(httpStatus.OK).json(
    response({
      message: "User updated",
      statusCode: httpStatus.OK,
      type: "user",
      data: pick(user.toJSON(), SELF_FIELDS),
    })
  );
});

module.exports = {
  getProfile,
  updateProfile,
};