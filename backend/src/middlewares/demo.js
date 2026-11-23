// Demo only (mounted in app.js when DEMO_MODE=true).
// Visitors share one owner account, so they must not lock each other out or fill the database.
const httpStatus = require("http-status");
const config = require("../config/config");
const ApiError = require("../utils/ApiError");
const { Customer } = require("../models");

const BLOCKED = [
  { method: "POST", path: "/auth/change-password" },
  { method: "PATCH", path: "/users/self/update" },
];

const DISABLED_MESSAGE = "This action is disabled in the demo.";

const demoGuard = async (req, res, next) => {
  try {
    const path = req.path.replace(/\/+$/, "");

    if (BLOCKED.some((rule) => rule.method === req.method && rule.path === path)) {
      throw new ApiError(httpStatus.FORBIDDEN, DISABLED_MESSAGE);
    }

    if (req.method === "POST" && path === "/customers") {
      const total = await Customer.estimatedDocumentCount();
      if (total >= config.app.demoMaxCustomers) {
        throw new ApiError(
          httpStatus.FORBIDDEN,
          `Demo limit reached (${config.app.demoMaxCustomers} customers). The data resets every night.`
        );
      }
    }

    return next();
  } catch (error) {
    return next(error);
  }
};

module.exports = { demoGuard };
