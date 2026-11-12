const express = require("express");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const compression = require("compression");
const cors = require("cors");
const passport = require("passport");
const httpStatus = require("http-status");
const config = require("./config/config");
const morgan = require("./config/morgan");
const { jwtStrategy } = require("./config/passport");
const { authLimiter, apiLimiter } = require("./middlewares/rateLimiter");
const routes = require("./routes/v1");
const { errorConverter, errorHandler } = require("./middlewares/error");
const ApiError = require("./utils/ApiError");

const app = express();

if (config.trustProxy > 0) {
  app.set("trust proxy", config.trustProxy);
}

if (config.env !== "test") {
  app.use(morgan.successHandler);
  app.use(morgan.errorHandler);
}

// security HTTP headers
app.use(helmet());

// CORS only for FRONTEND_URL (requests without an Origin header, like curl, are allowed)
const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || config.cors.origins.includes(origin)) {
      return callback(null, true);
    }
    return callback(null, false);
  },
};
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

// parse json and urlencoded request bodies
app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: true, limit: "100kb" }));

// sanitize request data
app.use(mongoSanitize());

// gzip compression
app.use(compression());

// jwt authentication
app.use(passport.initialize());
passport.use("jwt", jwtStrategy);

// rate limits (failed logins are limited harder than the general API)
if (config.env !== "test") {
  app.use("/api/v1/auth/login", authLimiter);
  app.use("/api/v1", apiLimiter);
}

// v1 api routes
app.use("/api/v1", routes);

// send back a 404 error for any unknown api request
app.use((req, res, next) => {
  next(new ApiError(httpStatus.NOT_FOUND, "Route not found"));
});

// convert error to ApiError, if needed
app.use(errorConverter);

// handle error
app.use(errorHandler);

module.exports = app;