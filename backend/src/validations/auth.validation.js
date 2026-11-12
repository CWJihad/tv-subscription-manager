const Joi = require("joi");
const { password } = require("./custom.validation");

const login = {
  body: Joi.object().keys({
    email: Joi.string().trim().lowercase().email({ tlds: { allow: false } }).required(),
    password: Joi.string().required(),
  }),
};

const logout = {
  body: Joi.object().keys({
    refreshToken: Joi.string().required(),
  }),
};

const refreshTokens = {
  body: Joi.object().keys({
    refreshToken: Joi.string().required(),
  }),
};

// oldPassword has NO complexity rule: legacy passwords must still be accepted.
const changePassword = {
  body: Joi.object().keys({
    oldPassword: Joi.string().required(),
    newPassword: Joi.string().required().custom(password),
  }),
};

module.exports = {
  login,
  logout,
  refreshTokens,
  changePassword,
};