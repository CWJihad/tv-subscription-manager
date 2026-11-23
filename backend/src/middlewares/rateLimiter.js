const rateLimit = require("express-rate-limit");
const httpStatus = require("http-status");
const config = require("../config/config");

// The public demo gets stricter limits.
const demo = config.app.demoMode;

const tooManyRequests = (req, res) =>
  res.status(httpStatus.TOO_MANY_REQUESTS).json({
    code: httpStatus.TOO_MANY_REQUESTS,
    message: "Too many requests, please try again later.",
  });

// Login: only failed attempts count.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: demo ? 10 : 20,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  handler: tooManyRequests,
});

// General API limit per IP.
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: demo ? 200 : 600,
  standardHeaders: true,
  legacyHeaders: false,
  handler: tooManyRequests,
});

module.exports = {
  authLimiter,
  apiLimiter,
};
