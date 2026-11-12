const httpStatus = require("http-status");
const catchAsync = require("../utils/catchAsync");
const response = require("../config/response");
const { authService, tokenService } = require("../services");

const login = catchAsync(async (req, res) => {
  const { email, password } = req.body;
  const user = await authService.loginUserWithEmailAndPassword(email, password);
  const tokens = await tokenService.generateAuthTokens(user);
  res.status(httpStatus.OK).json(
    response({
      message: "Login successful",
      statusCode: httpStatus.OK,
      type: "auth",
      data: { user, tokens },
    })
  );
});

const refreshTokens = catchAsync(async (req, res) => {
  const tokens = await authService.refreshAuth(req.body.refreshToken);
  res.status(httpStatus.OK).json(
    response({
      message: "Tokens refreshed",
      statusCode: httpStatus.OK,
      type: "auth",
      data: { tokens },
    })
  );
});

const logout = catchAsync(async (req, res) => {
  await authService.logout(req.user.id, req.body.refreshToken);
  res.status(httpStatus.OK).json(
    response({
      message: "Logout successful",
      statusCode: httpStatus.OK,
      type: "auth",
      data: {},
    })
  );
});

const changePassword = catchAsync(async (req, res) => {
  await authService.changePassword(req.user.id, req.body);
  res.status(httpStatus.OK).json(
    response({
      message: "Password changed",
      statusCode: httpStatus.OK,
      type: "auth",
      data: {},
    })
  );
});

module.exports = {
  login,
  refreshTokens,
  logout,
  changePassword,
};