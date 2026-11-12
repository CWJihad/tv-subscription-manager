const httpStatus = require("http-status");
const tokenService = require("./token.service");
const userService = require("./user.service");
const Token = require("../models/token.model");
const ApiError = require("../utils/ApiError");
const { tokenTypes } = require("../config/tokens");

const loginUserWithEmailAndPassword = async (email, password) => {
  const user = await userService.getUserByEmail(email);
  if (!user || user.isDeleted || !(await user.isPasswordMatch(password))) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Incorrect email or password");
  }
  return user;
};

const logout = async (userId, refreshToken) => {
  await Token.deleteMany({ token: refreshToken, type: tokenTypes.REFRESH, user: userId });
};

// Refresh tokens are single-use: the old one is deleted when a new pair is issued.
const refreshAuth = async (refreshToken) => {
  try {
    const refreshTokenDoc = await tokenService.verifyToken(refreshToken, tokenTypes.REFRESH);
    const user = await userService.getUserById(refreshTokenDoc.user);
    if (!user || user.isDeleted) {
      throw new Error("User not found");
    }
    await refreshTokenDoc.deleteOne();
    return await tokenService.generateAuthTokens(user);
  } catch (error) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Please authenticate");
  }
};

const changePassword = async (userId, { oldPassword, newPassword }) => {
  const user = await userService.getUserById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }
  if (!(await user.isPasswordMatch(oldPassword))) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Incorrect password");
  }
  if (await user.isPasswordMatch(newPassword)) {
    throw new ApiError(httpStatus.BAD_REQUEST, "New password cannot be the same as old password");
  }
  user.password = newPassword;
  await user.save();
  return user;
};

module.exports = {
  loginUserWithEmailAndPassword,
  logout,
  refreshAuth,
  changePassword,
};