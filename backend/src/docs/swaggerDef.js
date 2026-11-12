const { version } = require("../../package.json");

const swaggerDef = {
  openapi: "3.0.0",
  info: {
    title: "Nigertoday TV Subscription Manager API",
    version,
  },
  servers: [{ url: "/api/v1" }],
};

module.exports = swaggerDef;