const mongoose = require("mongoose");
const httpStatus = require("http-status");
const config = require("../config/config");
const logger = require("../config/logger");
const ApiError = require("../utils/ApiError");

const toApiError = (err) => {
  if (err instanceof mongoose.Error.ValidationError) {
    return new ApiError(httpStatus.BAD_REQUEST, err.message, true, err.stack);
  }
  if (err instanceof mongoose.Error.CastError) {
    return new ApiError(httpStatus.BAD_REQUEST, "Invalid request data", true, err.stack);
  }
  if (err && err.code === 11000) {
    return new ApiError(httpStatus.CONFLICT, "Resource already exists", true, err.stack);
  }

  const status = err.statusCode || err.status;
  // 4xx errors raised by Express/body-parser (for example malformed JSON) are safe to show
  if (status >= 400 && status < 500 && err.expose) {
    return new ApiError(status, err.message, true, err.stack);
  }

  const statusCode = status || (err instanceof mongoose.Error ? httpStatus.BAD_REQUEST : httpStatus.INTERNAL_SERVER_ERROR);
  return new ApiError(statusCode, err.message || httpStatus[statusCode], false, err.stack);
};

const errorConverter = (err, req, res, next) => {
  next(err instanceof ApiError ? err : toApiError(err));
};

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  let { statusCode, message } = err;
  if (config.env === "production" && !err.isOperational) {
    statusCode = httpStatus.INTERNAL_SERVER_ERROR;
    message = httpStatus[httpStatus.INTERNAL_SERVER_ERROR];
  }

  res.locals.errorMessage = err.message;

  if (!err.isOperational || config.env === "development") {
    logger.error(err);
  }

  const body = {
    code: statusCode,
    message,
    ...(config.env === "development" && { stack: err.stack }),
  };

  return res.status(statusCode).json(body);
};

module.exports = {
  errorConverter,
  errorHandler,
};