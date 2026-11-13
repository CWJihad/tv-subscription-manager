const { isValidDateOnly } = require("../utils/dates");
const { isValidMoney } = require("../utils/money");

const objectId = (value, helpers) => {
  if (!value.match(/^[0-9a-fA-F]{24}$/)) {
    return helpers.message('"{{#label}}" must be a valid mongo id');
  }
  return value;
};

const password = (value, helpers) => {
  if (value.length < 8) {
    return helpers.message("password must be at least 8 characters");
  }
  if (!value.match(/\d/) || !value.match(/[a-zA-Z]/)) {
    return helpers.message("password must contain at least 1 letter and 1 number");
  }
  return value;
};

/** "YYYY-MM-DD" that is a real calendar date. */
const dateOnly = (value, helpers) => {
  if (!isValidDateOnly(value)) {
    return helpers.message('"{{#label}}" must be a valid date (YYYY-MM-DD)');
  }
  return value;
};

/** Number with at most 2 decimals. */
const money = (value, helpers) => {
  if (!isValidMoney(value)) {
    return helpers.message('"{{#label}}" must have at most 2 decimals');
  }
  return value;
};

module.exports = {
  objectId,
  password,
  dateOnly,
  money,
};