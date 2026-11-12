const Joi = require("joi");

const updateProfile = {
  body: Joi.object()
    .keys({
      fullName: Joi.string().trim().min(2).max(80),
      email: Joi.string().trim().lowercase().email({ tlds: { allow: false } }),
    })
    .min(1),
};

module.exports = {
  updateProfile,
};