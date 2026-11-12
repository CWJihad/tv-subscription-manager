const express = require("express");
const config = require("../../config/config");
const healthRoute = require("./health.route");
const authRoute = require("./auth.route");
const userRoute = require("./user.route");
const docsRoute = require("./docs.route");
const customerRoute = require("./customer.route");
const renewalRoute = require("./renewal.route");

const router = express.Router();

const defaultRoutes = [
  { path: "/health", route: healthRoute },
  { path: "/auth", route: authRoute },
  { path: "/users", route: userRoute },
  { path: "/customer", route: customerRoute },
  { path: "/renewal", route: renewalRoute },
];

const devRoutes = [
  // routes available only in development mode
  { path: "/docs", route: docsRoute },
];

defaultRoutes.forEach((route) => {
  router.use(route.path, route.route);
});

/* istanbul ignore next */
if (config.env === "development") {
  devRoutes.forEach((route) => {
    router.use(route.path, route.route);
  });
}

module.exports = router;