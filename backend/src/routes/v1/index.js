const express = require("express");
const config = require("../../config/config");
const healthRoute = require("./health.route");
const authRoute = require("./auth.route");
const userRoute = require("./user.route");
const docsRoute = require("./docs.route");
const customerRoute = require("./customer.route");
const paymentRoute = require("./payment.route");
const settingsRoute = require("./settings.route");
const metaRoute = require("./meta.route");
const dashboardRoute = require("./dashboard.route");

const router = express.Router();

const defaultRoutes = [
  { path: "/health", route: healthRoute },
  { path: "/auth", route: authRoute },
  { path: "/users", route: userRoute },
  { path: "/customers", route: customerRoute },
  { path: "/payments", route: paymentRoute },
  { path: "/settings", route: settingsRoute },
  { path: "/meta", route: metaRoute },
  { path: "/dashboard", route: dashboardRoute },
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