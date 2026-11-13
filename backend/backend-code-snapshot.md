# Code snapshot
Generated: 2026-11-13T09:48:05.951Z

## src/app.js

```js
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
```

## src/config/business.js

```js
// Business constants. Timezone, currency and the expiring window are constants, not stored settings.
module.exports = Object.freeze({
  EXPIRING_WINDOW_DAYS: 10,
  CURRENCY: "BDT",
  DURATION_OPTIONS: Object.freeze([3, 6, 12]),
  RENEWAL_TYPES: Object.freeze(["initial", "renewal"]),
  PAYMENT_METHODS: Object.freeze(["cash", "bkash", "nagad", "rocket", "bank_transfer", "other"]),
  PAYMENT_STATUSES: Object.freeze(["paid", "unpaid"]),
  REMINDER_TYPES: Object.freeze(["d7", "d3", "d1", "expired"]),
  REMINDER_CHANNELS: Object.freeze(["email", "whatsapp"]),
  REMINDER_PROVIDERS: Object.freeze(["smtp", "whatsapp_cloud", "mock"]),
  REMINDER_LOG_STATUSES: Object.freeze(["sent", "failed", "skipped"]),
  DEFAULT_REMINDER_TEMPLATES: Object.freeze({
    d7: "Hi {firstName}, your TV subscription expires on {date} (7 days left). Please renew to keep your service running. Thank you!",
    d3: "Hi {firstName}, your TV subscription expires on {date} (3 days left). Please renew to keep your service running. Thank you!",
    d1: "Hi {firstName}, your TV subscription expires on {date} (1 day left). Please renew to keep your service running. Thank you!",
    expired: "Hi {firstName}, your TV subscription expired on {date}. Please renew to get your service back. Thank you!",
  }),
});
```

## src/config/config.js

```js
const dotenv = require("dotenv");
const path = require("path");
const Joi = require("joi");
const { IANAZone } = require("luxon");

dotenv.config({ path: path.join(__dirname, "../../.env") });

const optionalString = Joi.string().allow("");

const envVarsSchema = Joi.object()
  .keys({
    NODE_ENV: Joi.string().valid("production", "development", "test").required(),
    PORT: Joi.number().default(5000),
    BACKEND_IP: optionalString,
    TRUST_PROXY: Joi.number().integer().min(0).default(0).description("number of reverse proxies in front of the app"),
    MONGODB_URL: Joi.string().required().description("Mongo DB url"),

    JWT_SECRET: Joi.string().required().description("JWT secret key"),
    JWT_ACCESS_EXPIRATION_MINUTES: Joi.number().default(30),
    JWT_REFRESH_EXPIRATION_DAYS: Joi.number().default(30),

    FRONTEND_URL: Joi.string().default("http://localhost:3000").description("CORS allow-list, comma separated"),

    APP_TIMEZONE: Joi.string()
      .default("Asia/Dhaka")
      .custom((value, helpers) =>
        IANAZone.isValidZone(value) ? value : helpers.message('"APP_TIMEZONE" must be a valid IANA time zone')
      ),
    MOCK_TODAY: Joi.string().allow("").pattern(/^\d{4}-\d{2}-\d{2}$/).description("dev only, YYYY-MM-DD"),

    JOBS_ENABLED: Joi.boolean().default(false),
    REMINDERS_ENABLED: Joi.boolean().default(false),
    DEMO_MODE: Joi.boolean().default(false),

    EMAIL_PROVIDER: Joi.string().valid("mock", "smtp").default("mock"),
    SMTP_HOST: optionalString,
    SMTP_PORT: Joi.number().allow(""),
    SMTP_USERNAME: optionalString,
    SMTP_PASSWORD: optionalString,
    EMAIL_FROM: optionalString,

    WHATSAPP_PROVIDER: Joi.string().valid("mock", "cloud").default("mock"),
    WHATSAPP_TOKEN: optionalString,
    WHATSAPP_PHONE_NUMBER_ID: optionalString,
    WHATSAPP_API_VERSION: Joi.string().default("v21.0"),
    WHATSAPP_TEMPLATE_NAME: optionalString,
    WHATSAPP_TEMPLATE_NAME_EXPIRED: optionalString,
    WHATSAPP_TEMPLATE_LANG: Joi.string().default("en"),

    SEED_ADMIN_EMAIL: optionalString,
    SEED_ADMIN_PASSWORD: optionalString,
    SEED_FORCE: Joi.string().valid("yes", "no").default("no"),
  })
  .unknown();

const { value: envVars, error } = envVarsSchema.prefs({ errors: { label: "key" } }).validate(process.env);

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

if (envVars.NODE_ENV === "production" && envVars.MOCK_TODAY) {
  throw new Error("Config validation error: MOCK_TODAY must not be set in production");
}

if (envVars.EMAIL_PROVIDER === "smtp" && !(envVars.SMTP_HOST && envVars.SMTP_PORT && envVars.EMAIL_FROM)) {
  throw new Error("Config validation error: EMAIL_PROVIDER=smtp needs SMTP_HOST, SMTP_PORT and EMAIL_FROM");
}

if (
  envVars.WHATSAPP_PROVIDER === "cloud" &&
  !(envVars.WHATSAPP_TOKEN && envVars.WHATSAPP_PHONE_NUMBER_ID && envVars.WHATSAPP_TEMPLATE_NAME)
) {
  throw new Error(
    "Config validation error: WHATSAPP_PROVIDER=cloud needs WHATSAPP_TOKEN, WHATSAPP_PHONE_NUMBER_ID and WHATSAPP_TEMPLATE_NAME"
  );
}

module.exports = {
  env: envVars.NODE_ENV,
  port: envVars.PORT,
  host: envVars.BACKEND_IP || undefined,
  trustProxy: envVars.TRUST_PROXY,
  mongoose: {
    url: envVars.MONGODB_URL + (envVars.NODE_ENV === "test" ? "-test" : ""),
    options: {},
  },
  jwt: {
    secret: envVars.JWT_SECRET,
    accessExpirationMinutes: envVars.JWT_ACCESS_EXPIRATION_MINUTES,
    refreshExpirationDays: envVars.JWT_REFRESH_EXPIRATION_DAYS,
  },
  cors: {
    origins: envVars.FRONTEND_URL.split(",")
      .map((origin) => origin.trim())
      .filter(Boolean),
  },
  app: {
    timezone: envVars.APP_TIMEZONE,
    mockToday: envVars.MOCK_TODAY || null,
    demoMode: envVars.DEMO_MODE,
  },
  jobs: {
    enabled: envVars.JOBS_ENABLED,
    remindersEnabled: envVars.REMINDERS_ENABLED,
  },
  email: {
    provider: envVars.EMAIL_PROVIDER,
    smtp: {
      host: envVars.SMTP_HOST || undefined,
      port: envVars.SMTP_PORT || undefined,
      auth: {
        user: envVars.SMTP_USERNAME || undefined,
        pass: envVars.SMTP_PASSWORD || undefined,
      },
    },
    from: envVars.EMAIL_FROM || undefined,
  },
  whatsapp: {
    provider: envVars.WHATSAPP_PROVIDER,
    token: envVars.WHATSAPP_TOKEN || undefined,
    phoneNumberId: envVars.WHATSAPP_PHONE_NUMBER_ID || undefined,
    apiVersion: envVars.WHATSAPP_API_VERSION,
    templateName: envVars.WHATSAPP_TEMPLATE_NAME || undefined,
    templateNameExpired: envVars.WHATSAPP_TEMPLATE_NAME_EXPIRED || undefined,
    templateLang: envVars.WHATSAPP_TEMPLATE_LANG,
  },
  seed: {
    adminEmail: envVars.SEED_ADMIN_EMAIL || undefined,
    adminPassword: envVars.SEED_ADMIN_PASSWORD || undefined,
    force: envVars.SEED_FORCE,
  },
};
```

## src/config/logger.js

```js
const winston = require('winston');
const config = require('./config');

const enumerateErrorFormat = winston.format((info) => {
  if (info instanceof Error) {
    Object.assign(info, { message: info.stack });
  }
  return info;
});

const logger = winston.createLogger({
  level: config.env === 'development' ? 'debug' : 'info',
  format: winston.format.combine(
    enumerateErrorFormat(),
    config.env === 'development' ? winston.format.colorize() : winston.format.uncolorize(),
    winston.format.splat(),
    winston.format.timestamp({ format: 'YYYY-MM-DDTHH:mm:ss.SSSZ' }), // Add timestamp format
    winston.format.printf(({ timestamp, level, message }) => `[${level}] ${message}`) // Modify printf format
    //winston.format.printf(({ timestamp, level, message }) => `${timestamp} [${level}] ${message}`) // Modify printf format
    // winston.format.printf(({ level, message }) => `${level}: ${message}`)
  ),
  transports: [
    new winston.transports.Console({
      stderrLevels: ['error'],
    }),
    new winston.transports.File({ filename: 'app.log' }) // Add this line
  ],
});

module.exports = logger;

```

## src/config/morgan.js

```js
const morgan = require('morgan');
const config = require('./config');
const logger = require('./logger');

morgan.token('message', (req, res) => res.locals.errorMessage || '');

const getIpFormat = () => (config.env === 'production' ? ':remote-addr - ' : '');
const successResponseFormat = `${getIpFormat()}:method :url :status - :response-time ms`;
const errorResponseFormat = `${getIpFormat()}:method :url :status - :response-time ms - message: :message`;

const successHandler = morgan(successResponseFormat, {
  skip: (req, res) => res.statusCode >= 400,
  stream: { write: (message) => logger.info(message.trim()) },
});

const errorHandler = morgan(errorResponseFormat, {
  skip: (req, res) => res.statusCode < 400,
  stream: { write: (message) => logger.error(message.trim()) },
});

module.exports = {
  successHandler,
  errorHandler,
};

```

## src/config/passport.js

```js
const { Strategy: JwtStrategy, ExtractJwt } = require('passport-jwt');
const config = require('./config');
const { tokenTypes } = require('./tokens');
const { User } = require('../models');

const jwtOptions = {
  secretOrKey: config.jwt.secret,
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
};

const jwtVerify = async (payload, done) => {
  try {
    if (payload.type !== tokenTypes.ACCESS) {
      throw new Error('Invalid token type');
    }
    const user = await User.findById(payload.sub);
    if (!user) {
      return done(null, false);
    }
    done(null, user);
  } catch (error) {
    done(error, false);
  }
};

const jwtStrategy = new JwtStrategy(jwtOptions, jwtVerify);

module.exports = {
  jwtStrategy,
};

```

## src/config/response.js

```js
const response = (response = {}) => {
  const responseObject = {
    code: response.statusCode,
    message: response.message,
    data: {},
  };

  if (response.type) {
    responseObject.data.type = response.type;
  }

  if (response.data !== undefined) {
    responseObject.data.attributes = response.data;
  }

  if (response.token) {
    responseObject.data.token = response.token;
  }

  return responseObject;
};

module.exports = response;
```

## src/config/roles.js

```js
// An application depends on what roles it will have.

const allRoles = {
  // user: ["common", "user"],
  // admin: ["common", "commonAdmin", "admin"],
  admin: ["common", "admin"],
  // superAdmin: ["common", "commonAdmin", "superAdmin"],
};

const roles = Object.keys(allRoles);
const roleRights = new Map(Object.entries(allRoles));

module.exports = {
  roles,
  roleRights,
};

```

## src/config/tokens.js

```js
const tokenTypes = {
  ACCESS: 'access',
  REFRESH: 'refresh',
  RESET_PASSWORD: 'resetPassword',
  VERIFY_EMAIL: 'verifyEmail',
};

module.exports = {
  tokenTypes,
};

```

## src/controllers/auth.controller.js

```js
const httpStatus = require("http-status");
const catchAsync = require("../utils/catchAsync");
const response = require("../config/response");
const { authService, tokenService } = require("../services");

const login = catchAsync(async (req, res) => {
  const { email, password } = req.body;
  const user = await authService.loginUserWithEmailAndPassword(email, password);
  const tokens = await tokenService.generateAuthTokens(user);
  res.status(httpStatus.OK).json(
    response({
      message: "Login successful",
      statusCode: httpStatus.OK,
      type: "auth",
      data: { user, tokens },
    })
  );
});

const refreshTokens = catchAsync(async (req, res) => {
  const tokens = await authService.refreshAuth(req.body.refreshToken);
  res.status(httpStatus.OK).json(
    response({
      message: "Tokens refreshed",
      statusCode: httpStatus.OK,
      type: "auth",
      data: { tokens },
    })
  );
});

const logout = catchAsync(async (req, res) => {
  await authService.logout(req.user.id, req.body.refreshToken);
  res.status(httpStatus.OK).json(
    response({
      message: "Logout successful",
      statusCode: httpStatus.OK,
      type: "auth",
      data: {},
    })
  );
});

const changePassword = catchAsync(async (req, res) => {
  await authService.changePassword(req.user.id, req.body);
  res.status(httpStatus.OK).json(
    response({
      message: "Password changed",
      statusCode: httpStatus.OK,
      type: "auth",
      data: {},
    })
  );
});

module.exports = {
  login,
  refreshTokens,
  logout,
  changePassword,
};
```

## src/controllers/customer.controller.js

```js
const httpStatus = require("http-status");
const catchAsync = require("../utils/catchAsync");
const response = require("../config/response");
const { customerService, paymentService } = require("../services");

const listCustomers = catchAsync(async (req, res) => {
  const data = await customerService.listCustomers(req.query);
  res.status(httpStatus.OK).json(
    response({ message: "Customers", statusCode: httpStatus.OK, type: "customer", data })
  );
});

const getCustomerStats = catchAsync(async (req, res) => {
  const data = await customerService.getCustomerStats(req.query);
  res.status(httpStatus.OK).json(
    response({ message: "Customer stats", statusCode: httpStatus.OK, type: "customer", data })
  );
});

const getCustomer = catchAsync(async (req, res) => {
  const data = await customerService.getCustomerById(req.params.id);
  res.status(httpStatus.OK).json(
    response({ message: "Customer", statusCode: httpStatus.OK, type: "customer", data })
  );
});

const createCustomer = catchAsync(async (req, res) => {
  const data = await customerService.createCustomer(req.body);
  res.status(httpStatus.CREATED).json(
    response({ message: "Customer created", statusCode: httpStatus.CREATED, type: "customer", data })
  );
});

const updateCustomer = catchAsync(async (req, res) => {
  const data = await customerService.updateCustomer(req.params.id, req.body);
  res.status(httpStatus.OK).json(
    response({ message: "Customer updated", statusCode: httpStatus.OK, type: "customer", data })
  );
});

const renewCustomer = catchAsync(async (req, res) => {
  const data = await customerService.renewCustomer(req.params.id, req.body);
  res.status(httpStatus.OK).json(
    response({ message: "Customer renewed", statusCode: httpStatus.OK, type: "customer", data })
  );
});

const upsertRenewalPayment = catchAsync(async (req, res) => {
  const data = await paymentService.upsertPayment(req.params.id, req.params.renewalId, req.body);
  res.status(httpStatus.OK).json(
    response({ message: "Payment saved", statusCode: httpStatus.OK, type: "renewal", data })
  );
});

const deleteCustomer = catchAsync(async (req, res) => {
  const data = await customerService.deleteCustomer(req.params.id);
  res.status(httpStatus.OK).json(
    response({ message: "Customer deleted", statusCode: httpStatus.OK, type: "customer", data })
  );
});

module.exports = {
  listCustomers,
  getCustomerStats,
  getCustomer,
  createCustomer,
  updateCustomer,
  renewCustomer,
  upsertRenewalPayment,
  deleteCustomer,
};
```

## src/controllers/health.controller.js

```js
const httpStatus = require("http-status");
const catchAsync = require("../utils/catchAsync");
const response = require("../config/response");

const getHealth = catchAsync(async (req, res) => {
  res.status(httpStatus.OK).json(
    response({
      message: "OK",
      statusCode: httpStatus.OK,
      type: "health",
      data: { status: "ok" },
    })
  );
});

module.exports = {
  getHealth,
};
```

## src/controllers/index.js

```js
module.exports.authController = require('./auth.controller');
module.exports.userController = require('./user.controller');
module.exports.customerController = require('./customer.controller');
module.exports.paymentController = require('./payment.controller');
module.exports.healthController = require('./health.controller');
```

## src/controllers/payment.controller.js

```js
const httpStatus = require("http-status");
const catchAsync = require("../utils/catchAsync");
const response = require("../config/response");
const { paymentService } = require("../services");

const listPayments = catchAsync(async (req, res) => {
  const data = await paymentService.listPayments(req.query);
  res.status(httpStatus.OK).json(
    response({ message: "Payments", statusCode: httpStatus.OK, type: "payment", data })
  );
});

module.exports = {
  listPayments,
};
```

## src/controllers/user.controller.js

```js
const httpStatus = require("http-status");
const pick = require("../utils/pick");
const catchAsync = require("../utils/catchAsync");
const response = require("../config/response");
const { userService } = require("../services");

const SELF_FIELDS = ["id", "fullName", "email"];

const getProfile = catchAsync(async (req, res) => {
  res.status(httpStatus.OK).json(
    response({
      message: "User profile",
      statusCode: httpStatus.OK,
      type: "user",
      data: pick(req.user.toJSON(), SELF_FIELDS),
    })
  );
});

const updateProfile = catchAsync(async (req, res) => {
  const user = await userService.updateUserById(req.user.id, req.body);
  res.status(httpStatus.OK).json(
    response({
      message: "User updated",
      statusCode: httpStatus.OK,
      type: "user",
      data: pick(user.toJSON(), SELF_FIELDS),
    })
  );
});

module.exports = {
  getProfile,
  updateProfile,
};
```

## src/docs/components.yml

```yml
components:
  schemas:
    User:
      type: object
      properties:
        id:
          type: string
        email:
          type: string
          format: email
        name:
          type: string
        role:
          type: string
          enum: [user, admin]
      example:
        id: 5ebac534954b54139806c112
        email: fake@example.com
        name: fake name
        role: user

    Token:
      type: object
      properties:
        token:
          type: string
        expires:
          type: string
          format: date-time
      example:
        token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1ZWJhYzUzNDk1NGI1NDEzOTgwNmMxMTIiLCJpYXQiOjE1ODkyOTg0ODQsImV4cCI6MTU4OTMwMDI4NH0.m1U63blB0MLej_WfB7yC2FTMnCziif9X8yzwDEfJXAg
        expires: 2020-05-12T16:18:04.793Z

    AuthTokens:
      type: object
      properties:
        access:
          $ref: '#/components/schemas/Token'
        refresh:
          $ref: '#/components/schemas/Token'

    Error:
      type: object
      properties:
        code:
          type: number
        message:
          type: string

  responses:
    DuplicateEmail:
      description: Email already taken
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error'
          example:
            code: 400
            message: Email already taken
    Unauthorized:
      description: Unauthorized
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error'
          example:
            code: 401
            message: Please authenticate
    Forbidden:
      description: Forbidden
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error'
          example:
            code: 403
            message: Forbidden
    NotFound:
      description: Not found
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error'
          example:
            code: 404
            message: Not found

  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT

```

## src/docs/swaggerDef.js

```js
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
```

## src/index.js

```js
const mongoose = require("mongoose");
const app = require("./app");
const config = require("./config/config");
const logger = require("./config/logger");

// My Local IP Address
const myIp = process.env.BACKEND_IP;

let server;
mongoose.connect(config.mongoose.url, config.mongoose.options).then(() => {
  logger.info("Connected to MongoDB");
  server = app.listen(config.port, myIp, () => {
    // logger.info(`Listening to port ${config.port}`);
    logger.info(`Listening to ip http://${myIp}:${config.port}`);
  });

  server.listen(config.port, process.env.BACKEND_IP, () => {
    // logger.info(`Socket IO listening to port ${config.port}`);
  });
});

const exitHandler = () => {
  if (server) {
    server.close(() => {
      logger.info("Server closed");
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
};

const unexpectedErrorHandler = (error) => {
  logger.error(error);
  exitHandler();
};

process.on("uncaughtException", unexpectedErrorHandler);
process.on("unhandledRejection", unexpectedErrorHandler);

process.on("SIGTERM", () => {
  logger.info("SIGTERM received");
  if (server) {
    server.close();
  }
});

```

## src/middlewares/auth.js

```js
const passport = require("passport");
const httpStatus = require("http-status");
const ApiError = require("../utils/ApiError");
const { roleRights } = require("../config/roles");

const verifyCallback = (req, resolve, reject, requiredRights) => (err, user, info) => {
  if (err || info || !user || user.isDeleted) {
    return reject(new ApiError(httpStatus.UNAUTHORIZED, "Please authenticate"));
  }
  req.user = user;

  if (requiredRights.length) {
    const userRights = roleRights.get(user.role) || [];
    const hasRequiredRights = requiredRights.every((right) => userRights.includes(right));
    if (!hasRequiredRights) {
      return reject(new ApiError(httpStatus.FORBIDDEN, "Forbidden"));
    }
  }

  return resolve();
};

const auth =
  (...requiredRights) =>
  async (req, res, next) => {
    return new Promise((resolve, reject) => {
      passport.authenticate("jwt", { session: false }, verifyCallback(req, resolve, reject, requiredRights))(
        req,
        res,
        next
      );
    })
      .then(() => next())
      .catch((err) => next(err));
  };

module.exports = auth;
```

## src/middlewares/error.js

```js
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
```

## src/middlewares/rateLimiter.js

```js
const rateLimit = require("express-rate-limit");
const httpStatus = require("http-status");

const tooManyRequests = (req, res) =>
  res.status(httpStatus.TOO_MANY_REQUESTS).json({
    code: httpStatus.TOO_MANY_REQUESTS,
    message: "Too many requests, please try again later.",
  });

// Login: only failed attempts count.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  handler: tooManyRequests,
});

// General API limit per IP.
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 600,
  standardHeaders: true,
  legacyHeaders: false,
  handler: tooManyRequests,
});

module.exports = {
  authLimiter,
  apiLimiter,
};
```

## src/middlewares/validate.js

```js
const Joi = require('joi');
const httpStatus = require('http-status');
const pick = require('../utils/pick');
const ApiError = require('../utils/ApiError');

const validate = (schema) => (req, res, next) => {
  const validSchema = pick(schema, ['params', 'query', 'body']);
  const object = pick(req, Object.keys(validSchema));
  const { value, error } = Joi.compile(validSchema)
    .prefs({ errors: { label: 'key' }, abortEarly: false })
    .validate(object);

  if (error) {
    const errorMessage = error.details.map((details) => details.message).join(', ');
    return next(new ApiError(httpStatus.BAD_REQUEST, errorMessage));
  }
  Object.assign(req, value);
  return next();
};

module.exports = validate;

```

## src/models/customer.model.js

```js
const mongoose = require("mongoose");
const validator = require("validator");
const { toJSON, paginate } = require("./plugins");
const { DURATION_OPTIONS } = require("../config/business");

const normalizeEmail = (value) =>
  typeof value === "string" && value.trim() ? value.trim().toLowerCase() : null;

const customerSchema = mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 80,
    },
    phone: { type: String, required: true, unique: true, trim: true }, // normalized E.164
    email: {
      type: String,
      default: null,
      set: normalizeEmail,
      validate: {
        validator: (value) => !value || validator.isEmail(value),
        message: "Invalid email",
      },
    },
    startDate: { type: Date, required: true }, // start of the CURRENT period
    durationMonths: {
      type: Number,
      enum: [...DURATION_OPTIONS],
      required: true,
    }, // CURRENT period
    expiresAt: { type: Date, required: true, index: true },
    remindersEnabled: { type: Boolean, default: true },
  },
  { timestamps: true },
);

customerSchema.plugin(toJSON);
customerSchema.plugin(paginate);

module.exports = mongoose.model("Customer", customerSchema);

```

## src/models/index.js

```js
module.exports.Token = require("./token.model");
module.exports.User = require("./user.model");
module.exports.Customer = require("./customer.model");
module.exports.Renewal = require("./renewal.model");
module.exports.Payment = require("./payment.model");
module.exports.Settings = require("./settings.model");
module.exports.ReminderLog = require("./reminderLog.model");
```

## src/models/payment.model.js

```js
const mongoose = require("mongoose");
const { toJSON, paginate } = require("./plugins");
const {
  CURRENCY,
  PAYMENT_METHODS,
  PAYMENT_STATUSES,
} = require("../config/business");
const { isValidMoney } = require("../utils/money");

const paymentSchema = mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
      index: true,
    },
    renewalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Renewal",
      required: true,
      unique: true,
    }, // one payment per renewal
    amount: {
      type: Number,
      required: true,
      min: 0,
      validate: {
        validator: isValidMoney,
        message: "Amount must have at most 2 decimals",
      },
    },
    currency: { type: String, default: CURRENCY },
    method: { type: String, enum: [...PAYMENT_METHODS, null], default: null }, // null when unpaid
    status: { type: String, enum: [...PAYMENT_STATUSES], required: true },
    paidAt: { type: Date, default: null }, // date-only; required when paid (enforced in service)
    note: { type: String, trim: true, maxlength: 200, default: null },
  },
  { timestamps: true },
);

paymentSchema.plugin(toJSON);
paymentSchema.plugin(paginate);

module.exports = mongoose.model("Payment", paymentSchema);

```

## src/models/plugins/index.js

```js
module.exports.toJSON = require('./toJSON.plugin');
module.exports.paginate = require('./paginate.plugin');

```

## src/models/plugins/paginate.plugin.js

```js
const paginate = (schema) => {
  schema.statics.paginate = async function (filter, options) {
    let sort = '';
    if (options.sortBy) {
      const sortingCriteria = [];
      options.sortBy.split(',').forEach((sortOption) => {
        const [key, order] = sortOption.split(':');
        sortingCriteria.push((order === 'desc' ? '-' : '') + key);
      });
      sort = sortingCriteria.join(' ');
    } else {
      sort = 'createdAt';
    }

    const limit = options.limit && parseInt(options.limit, 10) > 0 ? parseInt(options.limit, 10) : 10;
    const page = options.page && parseInt(options.page, 10) > 0 ? parseInt(options.page, 10) : 1;
    const skip = (page - 1) * limit;

    const countPromise = this.countDocuments(filter).exec();
    let docsPromise = this.find(filter).sort(sort).skip(skip).limit(limit);

    if (options.populate) {
      options.populate.split(',').forEach((populateOption) => {
        const [field, ...fieldsToPopulate] = populateOption.split(' ');
        let populateFields = '';
        if (fieldsToPopulate.length > 0) {
          populateFields = fieldsToPopulate.join(' ');
        }
        docsPromise = docsPromise.populate({
          path: field,
          select: populateFields
        });
      });
    }

    docsPromise = docsPromise.exec();

    return Promise.all([countPromise, docsPromise]).then((values) => {
      const [totalResults, results] = values;
      const totalPages = Math.ceil(totalResults / limit);
      const result = {
        results,
        page,
        limit,
        totalPages,
        totalResults,
      };
      return Promise.resolve(result);
    });
  };
};

module.exports = paginate;


// const options = {
//   sortBy: 'createdAt:desc',
//   limit: 10,
//   page: 1,
//   populate: 'crewLeaders image username fullName email, affiliations' // Specify fields for crewLeaders and affiliations
// };
// Example

```

## src/models/plugins/toJSON.plugin.js

```js
/* eslint-disable no-param-reassign */

/**
 * A mongoose schema plugin which applies the following in the toJSON transform call:
 *  - removes __v, createdAt, updatedAt, and any path that has private: true
 *  - replaces _id with id
 */

const deleteAtPath = (obj, path, index) => {
  if (index === path.length - 1) {
    delete obj[path[index]];
    return;
  }
  deleteAtPath(obj[path[index]], path, index + 1);
};

const toJSON = (schema) => {
  let transform;
  if (schema.options.toJSON && schema.options.toJSON.transform) {
    transform = schema.options.toJSON.transform;
  }

  schema.options.toJSON = Object.assign(schema.options.toJSON || {}, {
    transform(doc, ret, options) {
      Object.keys(schema.paths).forEach((path) => {
        if (schema.paths[path].options && schema.paths[path].options.private) {
          deleteAtPath(ret, path.split('.'), 0);
        }
      });

      ret.id = ret._id.toString();
      delete ret._id;
      delete ret.__v;
      delete ret.fcmToken;
      delete ret.isDeleted;
      delete ret.isBlocked;
      delete ret.oneTimeCode;
      delete ret.isEmailVerified;
      delete ret.isResetPassword;
      delete ret.securitySettings;
      delete ret.updatedAt;
      // delete ret.createdAt;
      if (transform) {
        return transform(doc, ret, options);
      }
    },
  });
};

module.exports = toJSON;

```

## src/models/reminderLog.model.js

```js
const mongoose = require("mongoose");
const { toJSON, paginate } = require("./plugins");
const {
  REMINDER_TYPES,
  REMINDER_CHANNELS,
  REMINDER_PROVIDERS,
  REMINDER_LOG_STATUSES,
} = require("../config/business");

const reminderLogSchema = mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
      index: true,
    },
    periodEnd: { type: Date, required: true },
    type: { type: String, enum: [...REMINDER_TYPES], required: true },
    channel: { type: String, enum: [...REMINDER_CHANNELS], required: true },
    provider: { type: String, enum: [...REMINDER_PROVIDERS], required: true },
    status: { type: String, enum: [...REMINDER_LOG_STATUSES], required: true },
    attempts: { type: Number, default: 0 },
    reason: { type: String, default: null },
    error: { type: String, default: null },
    providerMessageId: { type: String, default: null },
    sentAt: { type: Date, default: null },
    to: { type: String, default: null }, // masked
  },
  { timestamps: true },
);

reminderLogSchema.index(
  { customerId: 1, periodEnd: 1, type: 1, channel: 1 },
  { unique: true },
);

reminderLogSchema.plugin(toJSON);
reminderLogSchema.plugin(paginate);

module.exports = mongoose.model("ReminderLog", reminderLogSchema);

```

## src/models/renewal.model.js

```js
const mongoose = require("mongoose");
const { toJSON, paginate } = require("./plugins");
const { DURATION_OPTIONS, RENEWAL_TYPES } = require("../config/business");

const renewalSchema = mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
      index: true,
    },
    type: { type: String, enum: [...RENEWAL_TYPES], required: true },
    periodStart: { type: Date, required: true },
    periodEnd: { type: Date, required: true },
    durationMonths: {
      type: Number,
      enum: [...DURATION_OPTIONS],
      required: true,
    },
  },
  { timestamps: true },
);

renewalSchema.index({ customerId: 1, periodStart: 1 });

renewalSchema.plugin(toJSON);
renewalSchema.plugin(paginate);

module.exports = mongoose.model("Renewal", renewalSchema);

```

## src/models/settings.model.js

```js
const mongoose = require("mongoose");
const { toJSON } = require("./plugins");
const {
  REMINDER_CHANNELS,
  DEFAULT_REMINDER_TEMPLATES,
} = require("../config/business");
const { isValidMoney } = require("../utils/money");

const template = (key) => ({
  type: String,
  trim: true,
  maxlength: 500,
  default: DEFAULT_REMINDER_TEMPLATES[key],
});
const price = {
  type: Number,
  min: 0,
  default: null,
  validate: { validator: isValidMoney, message: "Invalid price" },
};

const settingsSchema = mongoose.Schema(
  {
    key: { type: String, default: "main", unique: true, immutable: true }, // single document
    remind7Days: { type: Boolean, default: true },
    remind3Days: { type: Boolean, default: true },
    remind1Day: { type: Boolean, default: true },
    remindExpired: { type: Boolean, default: true },
    reminderChannels: {
      type: [{ type: String, enum: [...REMINDER_CHANNELS] }],
      default: () => [...REMINDER_CHANNELS],
    },
    reminderSendHour: {
      type: Number,
      min: 0,
      max: 23,
      default: 9,
      validate: {
        validator: Number.isInteger,
        message: "reminderSendHour must be an integer",
      },
    },
    reminderTemplates: {
      d7: template("d7"),
      d3: template("d3"),
      d1: template("d1"),
      expired: template("expired"),
    },
    prices: { m3: price, m6: price, m12: price },
  },
  { timestamps: true },
);

settingsSchema.plugin(toJSON);

module.exports = mongoose.model("Settings", settingsSchema);

```

## src/models/token.model.js

```js
const mongoose = require('mongoose');
const { toJSON } = require('./plugins');
const { tokenTypes } = require('../config/tokens');

const tokenSchema = mongoose.Schema(
  {
    token: {
      type: String,
      required: true,
      index: true,
    },
    user: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: [tokenTypes.REFRESH, tokenTypes.RESET_PASSWORD, tokenTypes.VERIFY_EMAIL],
      required: true,
    },
    expires: {
      type: Date,
      required: true,
    },
    blacklisted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// add plugin that converts mongoose to json
tokenSchema.plugin(toJSON);

/**
 * @typedef Token
 */
const Token = mongoose.model('Token', tokenSchema);

module.exports = Token;

```

## src/models/user.model.js

```js
const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const { toJSON, paginate } = require("./plugins");
const { roles } = require("../config/roles");

const userSchema = mongoose.Schema(
  {
    fullName: {
      type: String,
      required: false,
      trim: true,
      default: null,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      validate(value) {
        if (!validator.isEmail(value)) {
          throw new Error("Invalid email");
        }
      },
    },
    password: {
      type: String,
      required: false,
      trim: true,
      minlength: 8,
      validate(value) {
        if (!value.match(/\d/) || !value.match(/[a-zA-Z]/)) {
          throw new Error(
            "Password must contain at least one letter and one number"
          );
        }
      },
      private: true,
    },
    role: {
      type: String,
      enum: roles.admin,
    },
    oneTimeCode: {
      type: String,
      required: false,
      default: null
    },
    isEmailVerified: {
      type: Boolean,
      default: true,
    },
    isResetPassword: {
      type: Boolean,
      default: false,
    },
    isDeleted: {
      type: Boolean,
      default: false
    },
  },
  {
    timestamps: true,
  }
);

// add plugin that converts mongoose to json
userSchema.plugin(toJSON);
userSchema.plugin(paginate);

userSchema.statics.isEmailTaken = async function (email, excludeUserId) {
  const user = await this.findOne({ email, _id: { $ne: excludeUserId } });
  return !!user;
};
userSchema.statics.isPhoneNumberTaken = async function (
  phoneNumber,
  excludeUserId
) {
  const user = await this.findOne({ phoneNumber, _id: { $ne: excludeUserId } });
  return !!user;
};

userSchema.methods.isPasswordMatch = async function (password) {
  const user = this;
  return bcrypt.compare(password, user.password);
};

userSchema.pre("save", async function (next) {
  const user = this;
  if (user.isModified("password")) {
    user.password = await bcrypt.hash(user.password, 8);
  }
  next();
});

const User = mongoose.model("User", userSchema);

module.exports = User;

```

## src/routes/v1/auth.route.js

```js
const express = require("express");
const auth = require("../../middlewares/auth");
const validate = require("../../middlewares/validate");
const authValidation = require("../../validations/auth.validation");
const { authController } = require("../../controllers");

const router = express.Router();

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Admin login (public)
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       "200":
 *         description: Returns user and tokens
 *       "401":
 *         description: Incorrect email or password
 */
router.post("/login", validate(authValidation.login), authController.login);

/**
 * @swagger
 * /auth/refresh-tokens:
 *   post:
 *     summary: Exchange a refresh token for a new token pair (public, refresh token is single-use)
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       "200":
 *         description: Returns new tokens
 *       "401":
 *         description: Please authenticate
 */
router.post("/refresh-tokens", validate(authValidation.refreshTokens), authController.refreshTokens);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Log out (deletes the refresh token)
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       "200":
 *         description: Logged out
 *       "401":
 *         description: Please authenticate
 */
router.post("/logout", auth("admin"), validate(authValidation.logout), authController.logout);

/**
 * @swagger
 * /auth/change-password:
 *   post:
 *     summary: Change the admin password
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [oldPassword, newPassword]
 *             properties:
 *               oldPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *                 description: At least 8 characters with a letter and a number
 *     responses:
 *       "200":
 *         description: Password changed
 *       "400":
 *         description: Validation error or incorrect old password
 *       "401":
 *         description: Please authenticate
 */
router.post("/change-password", auth("admin"), validate(authValidation.changePassword), authController.changePassword);

module.exports = router;
```

## src/routes/v1/customer.route.js

```js
const express = require("express");
const auth = require("../../middlewares/auth");
const validate = require("../../middlewares/validate");
const customerValidation = require("../../validations/customer.validation");
const paymentValidation = require("../../validations/payment.validation");
const { customerController } = require("../../controllers");

const router = express.Router();

/**
 * @swagger
 * /customers/stats:
 *   get:
 *     summary: Status counts (total, active, expiring, expired, expiring buckets)
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Optional search on name, phone or email
 *     responses:
 *       "200":
 *         description: Returns total, active, expiring, expired and expiringBuckets
 *       "401":
 *         description: Please authenticate
 */
router.get("/stats", auth("admin"), validate(customerValidation.getCustomerStats), customerController.getCustomerStats);

/**
 * @swagger
 * /customers:
 *   get:
 *     summary: List customers (paginated)
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [all, active, expiring, expired]
 *       - in: query
 *         name: bucket
 *         schema:
 *           type: string
 *           enum: ["1-3", "4-7", "8-10"]
 *         description: Only used with status=expiring
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           maximum: 100
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [name, -name, expiry, -expiry, since, -since]
 *     responses:
 *       "200":
 *         description: Returns results, page, limit, totalPages, totalResults
 *       "400":
 *         description: Validation error
 *       "401":
 *         description: Please authenticate
 *   post:
 *     summary: Create a customer with the first subscription period
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [fullName, phone, durationMonths]
 *             properties:
 *               fullName:
 *                 type: string
 *               phone:
 *                 type: string
 *               email:
 *                 type: string
 *               startDate:
 *                 type: string
 *                 example: "2026-10-05"
 *               durationMonths:
 *                 type: integer
 *                 enum: [3, 6, 12]
 *               payment:
 *                 type: object
 *                 properties:
 *                   amount:
 *                     type: number
 *                   method:
 *                     type: string
 *                     enum: [cash, bkash, nagad, rocket, bank_transfer, other]
 *                   status:
 *                     type: string
 *                     enum: [paid, unpaid]
 *                   paidAt:
 *                     type: string
 *                   note:
 *                     type: string
 *     responses:
 *       "201":
 *         description: Returns the customer detail
 *       "400":
 *         description: Validation error
 *       "401":
 *         description: Please authenticate
 *       "409":
 *         description: Phone number already exists
 */
router
  .route("/")
  .get(auth("admin"), validate(customerValidation.getCustomers), customerController.listCustomers)
  .post(auth("admin"), validate(customerValidation.createCustomer), customerController.createCustomer);

/**
 * @swagger
 * /customers/{id}/renew:
 *   post:
 *     summary: Renew a subscription (new expiry = max(current expiry, today) + months)
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [durationMonths]
 *             properties:
 *               durationMonths:
 *                 type: integer
 *                 enum: [3, 6, 12]
 *               payment:
 *                 type: object
 *                 properties:
 *                   amount:
 *                     type: number
 *                   method:
 *                     type: string
 *                     enum: [cash, bkash, nagad, rocket, bank_transfer, other]
 *                   status:
 *                     type: string
 *                     enum: [paid, unpaid]
 *                   paidAt:
 *                     type: string
 *                   note:
 *                     type: string
 *     responses:
 *       "200":
 *         description: Returns the customer detail
 *       "400":
 *         description: Validation error
 *       "401":
 *         description: Please authenticate
 *       "404":
 *         description: Customer not found
 *       "409":
 *         description: Subscription was changed. Refresh and try again.
 */
router.post("/:id/renew", auth("admin"), validate(customerValidation.renewCustomer), customerController.renewCustomer);

/**
 * @swagger
 * /customers/{id}/renewals/{renewalId}/payment:
 *   put:
 *     summary: Create or replace the payment of one renewal
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: renewalId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [amount]
 *             properties:
 *               amount:
 *                 type: number
 *               method:
 *                 type: string
 *                 enum: [cash, bkash, nagad, rocket, bank_transfer, other]
 *               status:
 *                 type: string
 *                 enum: [paid, unpaid]
 *                 default: paid
 *               paidAt:
 *                 type: string
 *                 example: "2026-10-05"
 *               note:
 *                 type: string
 *     responses:
 *       "200":
 *         description: Returns the renewal item with its payment
 *       "400":
 *         description: Validation error (paid needs amount > 0 and a method)
 *       "401":
 *         description: Please authenticate
 *       "404":
 *         description: Customer not found or Renewal not found
 */
router.put(
  "/:id/renewals/:renewalId/payment",
  auth("admin"),
  validate(paymentValidation.upsertPayment),
  customerController.upsertRenewalPayment
);

/**
 * @swagger
 * /customers/{id}:
 *   get:
 *     summary: Get one customer with renewals and payments
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       "200":
 *         description: Returns the customer detail
 *       "401":
 *         description: Please authenticate
 *       "404":
 *         description: Customer not found
 *   patch:
 *     summary: Update name, phone, email or remindersEnabled
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fullName:
 *                 type: string
 *               phone:
 *                 type: string
 *               email:
 *                 type: string
 *               remindersEnabled:
 *                 type: boolean
 *     responses:
 *       "200":
 *         description: Returns the customer detail
 *       "400":
 *         description: Validation error
 *       "401":
 *         description: Please authenticate
 *       "404":
 *         description: Customer not found
 *       "409":
 *         description: Phone number already exists
 *   delete:
 *     summary: Delete a customer permanently (cascades to renewals, payments, reminder logs)
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       "200":
 *         description: Returns the deleted id
 *       "401":
 *         description: Please authenticate
 *       "404":
 *         description: Customer not found
 */
router
  .route("/:id")
  .get(auth("admin"), validate(customerValidation.getCustomer), customerController.getCustomer)
  .patch(auth("admin"), validate(customerValidation.updateCustomer), customerController.updateCustomer)
  .delete(auth("admin"), validate(customerValidation.deleteCustomer), customerController.deleteCustomer);

module.exports = router;
```

## src/routes/v1/docs.route.js

```js
const express = require("express");
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");
const swaggerDefinition = require("../../docs/swaggerDef");

const router = express.Router();

const specs = swaggerJsdoc({
  swaggerDefinition,
  apis: ["src/docs/*.yml", "src/routes/v1/*.js"],
});

router.use("/", swaggerUi.serve);
router.get("/", swaggerUi.setup(specs, { explorer: true }));

module.exports = router;
```

## src/routes/v1/health.route.js

```js
const express = require("express");
const { healthController } = require("../../controllers");

const router = express.Router();

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check (public)
 *     tags: [Health]
 *     responses:
 *       "200":
 *         description: Service is up
 */
router.get("/", healthController.getHealth);

module.exports = router;
```

## src/routes/v1/index.js

```js
const express = require("express");
const config = require("../../config/config");
const healthRoute = require("./health.route");
const authRoute = require("./auth.route");
const userRoute = require("./user.route");
const docsRoute = require("./docs.route");
const customerRoute = require("./customer.route");
const paymentRoute = require("./payment.route");

const router = express.Router();

const defaultRoutes = [
  { path: "/health", route: healthRoute },
  { path: "/auth", route: authRoute },
  { path: "/users", route: userRoute },
  { path: "/customers", route: customerRoute },
  { path: "/payments", route: paymentRoute },
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
```

## src/routes/v1/payment.route.js

```js
const express = require("express");
const auth = require("../../middlewares/auth");
const validate = require("../../middlewares/validate");
const paymentValidation = require("../../validations/payment.validation");
const { paymentController } = require("../../controllers");

const router = express.Router();

/**
 * @swagger
 * /payments:
 *   get:
 *     summary: List payments (paginated, newest paidAt first)
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [paid, unpaid]
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           example: "2026-10-01"
 *         description: paidAt on or after this date (unpaid payments have no paidAt)
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           example: "2026-10-31"
 *         description: paidAt on or before this date
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           maximum: 100
 *     responses:
 *       "200":
 *         description: Returns results (payment with customerId, customerName, renewalId), page, limit, totalPages, totalResults
 *       "400":
 *         description: Validation error
 *       "401":
 *         description: Please authenticate
 */
router.get("/", auth("admin"), validate(paymentValidation.getPayments), paymentController.listPayments);

module.exports = router;
```

## src/routes/v1/user.route.js

```js
const express = require("express");
const auth = require("../../middlewares/auth");
const validate = require("../../middlewares/validate");
const userValidation = require("../../validations/user.validation");
const { userController } = require("../../controllers");

const router = express.Router();

/**
 * @swagger
 * /users/self/in:
 *   get:
 *     summary: Get the logged-in admin
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       "200":
 *         description: Returns id, fullName, email
 *       "401":
 *         description: Please authenticate
 */
router.get("/self/in", auth("admin"), userController.getProfile);

/**
 * @swagger
 * /users/self/update:
 *   patch:
 *     summary: Update the logged-in admin (name, email)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fullName:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       "200":
 *         description: Returns the updated user
 *       "400":
 *         description: Validation error or email already taken
 *       "401":
 *         description: Please authenticate
 */
router.patch("/self/update", auth("admin"), validate(userValidation.updateProfile), userController.updateProfile);

module.exports = router;
```

## src/serializers/customer.serializer.js

```js
const { formatDateOnly } = require("../utils/dates");
const { getStatus } = require("../utils/status");

const idOf = (doc) => String(doc._id || doc.id);
const dateOrNull = (date) => (date ? formatDateOnly(date) : null);

const toPaymentDto = (payment) =>
  payment
    ? {
        id: idOf(payment),
        amount: payment.amount,
        currency: payment.currency,
        method: payment.method || null,
        status: payment.status,
        paidAt: dateOrNull(payment.paidAt),
        note: payment.note || null,
      }
    : null;

/** Payment list item (GET /payments). customerId may be populated with { fullName }. */
const toPaymentListItem = (payment) => {
  const customer = payment.customerId;
  const hasCustomer = Boolean(customer);
  return {
    ...toPaymentDto(payment),
    renewalId: String(payment.renewalId),
    customerId: hasCustomer ? String(customer._id || customer) : null,
    customerName: hasCustomer && customer.fullName ? customer.fullName : null,
  };
};

const toRenewalItem = (renewal, payment) => ({
  id: idOf(renewal),
  kind: renewal.type === "initial" ? "first" : "renewal",
  durationMonths: renewal.durationMonths,
  from: formatDateOnly(renewal.periodStart),
  to: formatDateOnly(renewal.periodEnd),
  payment: toPaymentDto(payment),
});

const toCustomerListItem = (customer, today) => {
  const { status, daysLeft } = getStatus(customer.expiresAt, today);
  return {
    id: idOf(customer),
    fullName: customer.fullName,
    email: customer.email || "", // frontend type is string
    phone: customer.phone,
    customerSince: formatDateOnly(customer.createdAt),
    currentStartDate: formatDateOnly(customer.startDate),
    durationMonths: customer.durationMonths,
    expiryDate: formatDateOnly(customer.expiresAt),
    status,
    daysLeft,
    remindersEnabled: customer.remindersEnabled,
  };
};

/** renewals and payments are arrays of docs (or lean objects) for this customer. */
const toCustomerDetail = (customer, renewals, payments, today) => {
  const paymentByRenewal = new Map(payments.map((payment) => [String(payment.renewalId), payment]));
  const sorted = [...renewals].sort(
    (a, b) => a.periodStart - b.periodStart || String(a._id).localeCompare(String(b._id))
  );
  return {
    ...toCustomerListItem(customer, today),
    renewals: sorted.map((renewal) => toRenewalItem(renewal, paymentByRenewal.get(idOf(renewal)))),
  };
};

module.exports = {
  toPaymentDto,
  toPaymentListItem,
  toRenewalItem,
  toCustomerListItem,
  toCustomerDetail,
};
```

## src/services/auth.service.js

```js
const httpStatus = require("http-status");
const tokenService = require("./token.service");
const userService = require("./user.service");
const Token = require("../models/token.model");
const ApiError = require("../utils/ApiError");
const { tokenTypes } = require("../config/tokens");

const loginUserWithEmailAndPassword = async (email, password) => {
  const user = await userService.getUserByEmail(email);
  if (!user || user.isDeleted || !(await user.isPasswordMatch(password))) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Incorrect email or password");
  }
  return user;
};

const logout = async (userId, refreshToken) => {
  await Token.deleteMany({ token: refreshToken, type: tokenTypes.REFRESH, user: userId });
};

// Refresh tokens are single-use: the old one is deleted when a new pair is issued.
const refreshAuth = async (refreshToken) => {
  try {
    const refreshTokenDoc = await tokenService.verifyToken(refreshToken, tokenTypes.REFRESH);
    const user = await userService.getUserById(refreshTokenDoc.user);
    if (!user || user.isDeleted) {
      throw new Error("User not found");
    }
    await refreshTokenDoc.deleteOne();
    return await tokenService.generateAuthTokens(user);
  } catch (error) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Please authenticate");
  }
};

const changePassword = async (userId, { oldPassword, newPassword }) => {
  const user = await userService.getUserById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }
  if (!(await user.isPasswordMatch(oldPassword))) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Incorrect password");
  }
  if (await user.isPasswordMatch(newPassword)) {
    throw new ApiError(httpStatus.BAD_REQUEST, "New password cannot be the same as old password");
  }
  user.password = newPassword;
  await user.save();
  return user;
};

module.exports = {
  loginUserWithEmailAndPassword,
  logout,
  refreshAuth,
  changePassword,
};
```

## src/services/customer.service.js

```js
const httpStatus = require("http-status");
const escapeRegExp = require("lodash/escapeRegExp");
const { Customer, Renewal, Payment, ReminderLog } = require("../models");
const ApiError = require("../utils/ApiError");
const { normalizePhone } = require("../utils/phone");
const { parseDateOnly } = require("../utils/dates");
const { getToday } = require("../utils/today");
const { getStatusRanges } = require("../utils/status");
const { calcExpiry, getRenewalBase } = require("../utils/subscription");
const { toCustomerListItem, toCustomerDetail } = require("../serializers/customer.serializer");
const paymentService = require("./payment.service");

const SORT_OPTIONS = {
  name: "fullName:asc",
  "-name": "fullName:desc",
  expiry: "expiresAt:asc",
  "-expiry": "expiresAt:desc",
  since: "createdAt:asc",
  "-since": "createdAt:desc",
};

const SUBSCRIPTION_CHANGED = "Subscription was changed. Refresh and try again.";

const isDuplicateKey = (error) => Boolean(error) && error.code === 11000;
const phoneExists = () => new ApiError(httpStatus.CONFLICT, "Phone number already exists");

const findCustomerOrThrow = async (id) => {
  const customer = await Customer.findById(id);
  if (!customer) {
    throw new ApiError(httpStatus.NOT_FOUND, "Customer not found");
  }
  return customer;
};

const assertPhoneAvailable = async (phone, excludeId) => {
  const filter = { phone };
  if (excludeId) filter._id = { $ne: excludeId };
  if (await Customer.exists(filter)) throw phoneExists();
};

const buildDetail = async (customer, today) => {
  const [renewals, payments] = await Promise.all([
    Renewal.find({ customerId: customer._id }).lean(),
    Payment.find({ customerId: customer._id }).lean(),
  ]);
  return toCustomerDetail(customer, renewals, payments, today);
};

/** Case-insensitive match on name, phone or email. Input is escaped. */
const buildSearchFilter = (q) => {
  const term = typeof q === "string" ? q.trim() : "";
  if (!term) return {};
  const regex = new RegExp(escapeRegExp(term), "i");
  return { $or: [{ fullName: regex }, { phone: regex }, { email: regex }] };
};

const buildListFilter = ({ status, bucket, q }, today) => {
  const ranges = getStatusRanges(today);
  const filter = buildSearchFilter(q);
  if (status === "active" || status === "expired") {
    filter.expiresAt = ranges[status];
  } else if (status === "expiring") {
    filter.expiresAt = bucket ? ranges.buckets[bucket] : ranges.expiring;
  }
  return filter;
};

const getSortBy = ({ status, sort }) => {
  let base;
  if (sort) base = SORT_OPTIONS[sort];
  else if (status === "expiring") base = "expiresAt:asc";
  else if (status === "expired") base = "expiresAt:desc";
  else base = "_id:asc";
  return base.startsWith("_id") ? base : `${base},_id:asc`;
};

const listCustomers = async (query) => {
  const today = getToday();
  const filter = buildListFilter(query, today);
  const result = await Customer.paginate(filter, {
    sortBy: getSortBy(query),
    page: query.page,
    limit: query.limit,
  });
  return {
    ...result,
    results: result.results.map((customer) => toCustomerListItem(customer, today)),
  };
};

const getCustomerStats = async ({ q } = {}) => {
  const today = getToday();
  const ranges = getStatusRanges(today);
  const base = buildSearchFilter(q);
  const count = (expiresAt) => Customer.countDocuments(expiresAt ? { ...base, expiresAt } : base);

  const [total, active, expiring, expired, b13, b47, b810] = await Promise.all([
    count(),
    count(ranges.active),
    count(ranges.expiring),
    count(ranges.expired),
    count(ranges.buckets["1-3"]),
    count(ranges.buckets["4-7"]),
    count(ranges.buckets["8-10"]),
  ]);

  return {
    total,
    active,
    expiring,
    expired,
    expiringBuckets: { "1-3": b13, "4-7": b47, "8-10": b810 },
  };
};

const getCustomerById = async (id) => {
  const customer = await findCustomerOrThrow(id);
  return buildDetail(customer, getToday());
};

const createCustomer = async (body) => {
  const today = getToday();
  const phone = normalizePhone(body.phone);
  await assertPhoneAvailable(phone);

  const startDate = body.startDate ? parseDateOnly(body.startDate) : today;
  const expiresAt = calcExpiry(startDate, body.durationMonths);
  // Validate the payment before anything is written.
  const paymentFields = body.payment ? paymentService.buildPaymentFields(body.payment, today) : null;

  let customer;
  try {
    customer = await Customer.create({
      fullName: body.fullName,
      phone,
      email: body.email,
      startDate,
      durationMonths: body.durationMonths,
      expiresAt,
      createdAt: startDate, // customerSince = start date
    });
  } catch (error) {
    if (isDuplicateKey(error)) throw phoneExists();
    throw error;
  }

  try {
    const renewal = await Renewal.create({
      customerId: customer._id,
      type: "initial",
      periodStart: startDate,
      periodEnd: expiresAt,
      durationMonths: body.durationMonths,
    });
    if (paymentFields) {
      await paymentService.createPayment(customer._id, renewal._id, paymentFields);
    }
  } catch (error) {
    // No transactions (D9): undo what was created, then rethrow.
    await Promise.allSettled([
      Payment.deleteMany({ customerId: customer._id }),
      Renewal.deleteMany({ customerId: customer._id }),
      Customer.deleteOne({ _id: customer._id }),
    ]);
    throw error;
  }

  return buildDetail(customer, today);
};

/** Only name, email, phone and remindersEnabled. Dates are never touched here. */
const updateCustomer = async (id, body) => {
  const customer = await findCustomerOrThrow(id);
  const updates = {};

  if (body.fullName !== undefined) updates.fullName = body.fullName;
  if (body.email !== undefined) updates.email = body.email;
  if (body.remindersEnabled !== undefined) updates.remindersEnabled = body.remindersEnabled;
  if (body.phone !== undefined) {
    const phone = normalizePhone(body.phone);
    if (phone !== customer.phone) {
      await assertPhoneAvailable(phone, customer._id);
      updates.phone = phone;
    }
  }

  customer.set(updates);
  try {
    await customer.save();
  } catch (error) {
    if (isDuplicateKey(error)) throw phoneExists();
    throw error;
  }
  return buildDetail(customer, getToday());
};

/**
 * D6: newExpiry = max(currentExpiry, today) + months.
 * Conditional update on the old expiresAt (D9): a parallel renew or a delete gives 409.
 */
const renewCustomer = async (id, body) => {
  const customer = await findCustomerOrThrow(id);
  const today = getToday();
  // Validate the payment before anything is written.
  const paymentFields = body.payment ? paymentService.buildPaymentFields(body.payment, today) : null;

  const previous = {
    startDate: customer.startDate,
    durationMonths: customer.durationMonths,
    expiresAt: customer.expiresAt,
  };
  const base = getRenewalBase(previous.expiresAt, today);
  const newExpiry = calcExpiry(base, body.durationMonths);

  const updated = await Customer.findOneAndUpdate(
    { _id: customer._id, expiresAt: previous.expiresAt },
    { $set: { startDate: base, durationMonths: body.durationMonths, expiresAt: newExpiry } },
    { new: true }
  );
  if (!updated) {
    throw new ApiError(httpStatus.CONFLICT, SUBSCRIPTION_CHANGED);
  }

  let renewal;
  try {
    renewal = await Renewal.create({
      customerId: customer._id,
      type: "renewal",
      periodStart: base,
      periodEnd: newExpiry,
      durationMonths: body.durationMonths,
    });
    if (paymentFields) {
      await paymentService.createPayment(customer._id, renewal._id, paymentFields);
    }
  } catch (error) {
    // No transactions (D9): restore the old period (only if still ours), delete what was created.
    const cleanup = [Customer.updateOne({ _id: customer._id, expiresAt: newExpiry }, { $set: previous })];
    if (renewal) {
      cleanup.push(Payment.deleteOne({ renewalId: renewal._id }), Renewal.deleteOne({ _id: renewal._id }));
    }
    await Promise.allSettled(cleanup);
    throw error;
  }

  return buildDetail(updated, today);
};

const deleteCustomer = async (id) => {
  const customer = await findCustomerOrThrow(id);
  await Customer.deleteOne({ _id: customer._id });
  await Promise.all([
    Renewal.deleteMany({ customerId: customer._id }),
    Payment.deleteMany({ customerId: customer._id }),
    ReminderLog.deleteMany({ customerId: customer._id }),
  ]);
  return { id: String(customer._id) };
};

module.exports = {
  listCustomers,
  getCustomerStats,
  getCustomerById,
  createCustomer,
  updateCustomer,
  renewCustomer,
  deleteCustomer,
};
```

## src/services/index.js

```js
module.exports.authService = require('./auth.service');
module.exports.tokenService = require('./token.service');
module.exports.userService = require('./user.service');
module.exports.customerService = require('./customer.service');
module.exports.paymentService = require('./payment.service');
```

## src/services/payment.service.js

```js
const httpStatus = require("http-status");
const { Payment, Customer, Renewal } = require("../models");
const ApiError = require("../utils/ApiError");
const { parseDateOnly } = require("../utils/dates");
const { getToday } = require("../utils/today");
const { CURRENCY } = require("../config/business");
const { toRenewalItem, toPaymentListItem } = require("../serializers/customer.serializer");

const isDuplicateKey = (error) => Boolean(error) && error.code === 11000;

/**
 * Validates the business rules and returns the Payment fields (without ids).
 * paid: amount > 0, method required, paidAt defaults to today.
 * unpaid: no method, no paidAt.
 */
const buildPaymentFields = (payment, today) => {
  const status = payment.status || "paid";
  const note = payment.note || null;

  if (status === "paid") {
    if (!(payment.amount > 0)) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Amount must be greater than 0 for a paid payment");
    }
    if (!payment.method) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Payment method is required for a paid payment");
    }
    return {
      amount: payment.amount,
      currency: CURRENCY,
      method: payment.method,
      status: "paid",
      paidAt: payment.paidAt ? parseDateOnly(payment.paidAt) : today,
      note,
    };
  }

  return {
    amount: payment.amount,
    currency: CURRENCY,
    method: null,
    status: "unpaid",
    paidAt: null,
    note,
  };
};

const createPayment = async (customerId, renewalId, fields) => Payment.create({ customerId, renewalId, ...fields });

const saveByRenewal = (customerId, renewalId, fields) =>
  Payment.findOneAndUpdate(
    { renewalId },
    { $set: { customerId, ...fields } },
    { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
  );

/** One payment per renewal. Creates or replaces it. Returns the renewal item with its payment. */
const upsertPayment = async (customerId, renewalId, body) => {
  if (!(await Customer.exists({ _id: customerId }))) {
    throw new ApiError(httpStatus.NOT_FOUND, "Customer not found");
  }
  const renewal = await Renewal.findOne({ _id: renewalId, customerId });
  if (!renewal) {
    throw new ApiError(httpStatus.NOT_FOUND, "Renewal not found");
  }

  const fields = buildPaymentFields(body, getToday());

  let payment;
  try {
    payment = await saveByRenewal(customerId, renewal._id, fields);
  } catch (error) {
    if (!isDuplicateKey(error)) throw error;
    // Two parallel upserts raced on the unique renewalId index: the second one now updates.
    payment = await saveByRenewal(customerId, renewal._id, fields);
  }
  return toRenewalItem(renewal, payment);
};

const listPayments = async ({ status, from, to, page, limit }) => {
  if (from && to && from > to) {
    throw new ApiError(httpStatus.BAD_REQUEST, '"from" must not be after "to"');
  }
  const filter = {};
  if (status) filter.status = status;
  if (from || to) {
    filter.paidAt = {};
    if (from) filter.paidAt.$gte = parseDateOnly(from);
    if (to) filter.paidAt.$lte = parseDateOnly(to);
  }

  const result = await Payment.paginate(filter, {
    sortBy: "paidAt:desc,_id:desc",
    page,
    limit,
    populate: "customerId fullName",
  });
  return {
    ...result,
    results: result.results.map(toPaymentListItem),
  };
};

module.exports = {
  buildPaymentFields,
  createPayment,
  upsertPayment,
  listPayments,
};
```

## src/services/token.service.js

```js
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const { DateTime } = require("luxon");
const config = require("../config/config");
const { Token } = require("../models");
const { tokenTypes } = require("../config/tokens");

const generateToken = (userId, expires, type, secret = config.jwt.secret) => {
  const payload = {
    sub: userId,
    iat: Math.floor(DateTime.utc().toSeconds()),
    exp: Math.floor(expires.toSeconds()),
    type,
    jti: crypto.randomUUID(),
  };
  return jwt.sign(payload, secret);
};

const saveToken = async (token, userId, expires, type, blacklisted = false) => {
  return Token.create({
    token,
    user: userId,
    expires: expires.toJSDate(),
    type,
    blacklisted,
  });
};

const verifyToken = async (token, type) => {
  const payload = jwt.verify(token, config.jwt.secret);
  if (payload.type !== type) {
    throw new Error("Invalid token type");
  }
  const tokenDoc = await Token.findOne({ token, type, user: payload.sub, blacklisted: false });
  if (!tokenDoc) {
    throw new Error("Token not found");
  }
  return tokenDoc;
};

const generateAuthTokens = async (user) => {
  const now = DateTime.utc();

  const accessTokenExpires = now.plus({ minutes: config.jwt.accessExpirationMinutes });
  const accessToken = generateToken(user.id, accessTokenExpires, tokenTypes.ACCESS);

  const refreshTokenExpires = now.plus({ days: config.jwt.refreshExpirationDays });
  const refreshToken = generateToken(user.id, refreshTokenExpires, tokenTypes.REFRESH);
  await saveToken(refreshToken, user.id, refreshTokenExpires, tokenTypes.REFRESH);

  return {
    access: {
      token: accessToken,
      expires: accessTokenExpires.toJSDate(),
    },
    refresh: {
      token: refreshToken,
      expires: refreshTokenExpires.toJSDate(),
    },
  };
};

module.exports = {
  generateToken,
  saveToken,
  verifyToken,
  generateAuthTokens,
};
```

## src/services/user.service.js

```js
const httpStatus = require("http-status");
const { User } = require("../models");
const ApiError = require("../utils/ApiError");

const getUserById = async (id) => {
  return User.findById(id);
};

const getUserByEmail = async (email) => {
  return User.findOne({ email });
};

const updateUserById = async (userId, updateBody) => {
  const user = await getUserById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }
  if (updateBody.email && (await User.isEmailTaken(updateBody.email, userId))) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Email already taken");
  }
  Object.assign(user, updateBody);
  await user.save();
  return user;
};

module.exports = {
  getUserById,
  getUserByEmail,
  updateUserById,
};
```

## src/utils/ApiError.js

```js
class ApiError extends Error {
  constructor(statusCode, message, isOperational = true, stack = '') {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

module.exports = ApiError;

```

## src/utils/catchAsync.js

```js
const catchAsync = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch((err) => next(err));
};

module.exports = catchAsync;

```

## src/utils/dates.js

```js
const DATE_ONLY_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const MS_PER_DAY = 86_400_000;

const isValidDateOnly = (str) => {
  if (typeof str !== "string") return false;
  const match = DATE_ONLY_RE.exec(str);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
};

/** "YYYY-MM-DD" -> Date at 00:00:00.000Z. Throws on invalid input. */
const parseDateOnly = (str) => {
  if (!isValidDateOnly(str)) throw new Error(`Invalid date: ${str}`);
  return new Date(`${str}T00:00:00.000Z`);
};

/** Date -> "YYYY-MM-DD" (UTC). */
const formatDateOnly = (date) => date.toISOString().slice(0, 10);

const addDays = (date, n) => new Date(date.getTime() + n * MS_PER_DAY);

const daysInMonth = (year, monthIndex) => new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();

/** Adds calendar months; clamps to the last day of the target month. */
const addMonths = (date, n) => {
  const total = date.getUTCMonth() + n;
  const year = date.getUTCFullYear() + Math.floor(total / 12);
  const monthIndex = ((total % 12) + 12) % 12;
  const day = Math.min(date.getUTCDate(), daysInMonth(year, monthIndex));
  return new Date(Date.UTC(year, monthIndex, day));
};

/** Whole calendar days: a minus b. */
const diffDays = (a, b) => Math.round((a.getTime() - b.getTime()) / MS_PER_DAY);

module.exports = {
  parseDateOnly,
  formatDateOnly,
  addDays,
  addMonths,
  diffDays,
  isValidDateOnly,
};
```

## src/utils/money.js

```js
/** Money: finite number >= 0 with at most 2 decimals. null/undefined allowed (use `required` separately). */
const isValidMoney = (value) =>
  value === null || value === undefined || (Number.isFinite(value) && value >= 0 && Math.round(value * 100) / 100 === value);

module.exports = { isValidMoney };
```

## src/utils/phone.js

```js
const httpStatus = require("http-status");
const ApiError = require("./ApiError");

const E164_RE = /^\+[1-9]\d{7,14}$/;
const BD_LOCAL_RE = /^0?1[3-9]\d{8}$/;

/** Normalizes to E.164. Throws 400 when invalid. */
const normalizePhone = (input) => {
  const invalid = () => new ApiError(httpStatus.BAD_REQUEST, "Enter a valid phone number");
  if (typeof input !== "string") throw invalid();

  let value = input.replace(/[\s\-.()]/g, "");
  if (value.startsWith("00")) value = `+${value.slice(2)}`;
  else if (value.startsWith("+")) value = value;
  else if (value.startsWith("880")) value = `+${value}`;
  else if (BD_LOCAL_RE.test(value)) value = `+880${value.replace(/^0/, "")}`;

  if (!E164_RE.test(value)) throw invalid();
  return value;
};

const maskPhone = (phone) => (phone ? `***${String(phone).slice(-4)}` : "");

module.exports = {
  normalizePhone,
  maskPhone,
};
```

## src/utils/pick.js

```js
/**
 * Create an object composed of the picked object properties
 * @param {Object} object
 * @param {string[]} keys
 * @returns {Object}
 */
const pick = (object, keys) => {
  return keys.reduce((obj, key) => {
    if (object && Object.prototype.hasOwnProperty.call(object, key)) {
      // eslint-disable-next-line no-param-reassign
      obj[key] = object[key];
    }
    return obj;
  }, {});
};

module.exports = pick;

```

## src/utils/seeder.js

```js
// Minimal safe seeder for B1 (creates the owner only). Rewritten in B6.
const mongoose = require("mongoose");
const config = require("../config/config");
const { User } = require("../models");

const OWNER_NAME = "Alex Owner";

const run = async () => {
  if (config.env === "production" && config.seed.force !== "yes") {
    console.error("Refusing to seed in production. Set SEED_FORCE=yes to override.");
    process.exit(1);
  }
  const { adminEmail, adminPassword } = config.seed;
  if (!adminEmail || !adminPassword) {
    console.error("SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD must be set in .env");
    process.exit(1);
  }

  await mongoose.connect(config.mongoose.url, config.mongoose.options);
  try {
    await User.deleteOne({ email: adminEmail.toLowerCase() });
    await User.create({
      fullName: OWNER_NAME,
      email: adminEmail,
      password: adminPassword,
      role: "admin",
      isEmailVerified: true,
    });
    console.log("Owner account seeded.");
  } finally {
    await mongoose.disconnect();
  }
};

run().catch((error) => {
  console.error("Seeding failed:", error.message);
  process.exit(1);
});
```

## src/utils/status.js

```js
const { EXPIRING_WINDOW_DAYS } = require("../config/business");
const { diffDays, addDays } = require("./dates");

/** Active: > 10 days left. Expiring: 0-10. Expired: < 0. */
const getStatus = (expiresAt, today) => {
  const daysLeft = diffDays(expiresAt, today);
  if (daysLeft < 0) return { status: "expired", daysLeft };
  if (daysLeft <= EXPIRING_WINDOW_DAYS) return { status: "expiring", daysLeft };
  return { status: "active", daysLeft };
};

const getExpiringBucket = (daysLeft) => {
  if (daysLeft < 0 || daysLeft > EXPIRING_WINDOW_DAYS) return null;
  if (daysLeft <= 3) return "1-3";
  if (daysLeft <= 7) return "4-7";
  return "8-10";
};

/** `expiresAt` query conditions, e.g. Customer.countDocuments({ expiresAt: ranges.active }). */
const getStatusRanges = (today) => {
  const end = addDays(today, EXPIRING_WINDOW_DAYS);
  return {
    active: { $gt: end },
    expiring: { $gte: today, $lte: end },
    expired: { $lt: today },
    buckets: {
      "1-3": { $gte: today, $lte: addDays(today, 3) },
      "4-7": { $gte: addDays(today, 4), $lte: addDays(today, 7) },
      "8-10": { $gte: addDays(today, 8), $lte: end },
    },
  };
};

module.exports = {
  getStatus,
  getExpiringBucket,
  getStatusRanges,
};
```

## src/utils/subscription.js

```js
const { addMonths } = require("./dates");

/** D6: renewal starts at the later of current expiry and today. One function to change if reversed. */
const getRenewalBase = (currentExpiry, today) => (currentExpiry.getTime() > today.getTime() ? currentExpiry : today);

const calcExpiry = (start, months) => addMonths(start, months);

module.exports = {
  getRenewalBase,
  calcExpiry,
};
```

## src/utils/today.js

```js
const { DateTime } = require("luxon");
const config = require("../config/config");
const { parseDateOnly } = require("./dates");

/** Current time in APP_TIMEZONE (luxon DateTime). Used by the reminder job. */
const getNowInZone = () => DateTime.now().setZone(config.app.timezone);

/** The ONLY place that defines "today": a Date at 00:00:00.000Z. */
const getToday = () => {
  if (config.app.mockToday) return parseDateOnly(config.app.mockToday);
  const now = getNowInZone();
  return new Date(Date.UTC(now.year, now.month - 1, now.day));
};

module.exports = {
  getToday,
  getNowInZone,
};
```

## src/validations/auth.validation.js

```js
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
```

## src/validations/custom.validation.js

```js
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
```

## src/validations/customer.validation.js

```js
const Joi = require("joi");
const { objectId, dateOnly } = require("./custom.validation");
const { paymentInput } = require("./payment.validation");
const { DURATION_OPTIONS } = require("../config/business");

const fullName = Joi.string().trim().min(2).max(80);
const phone = Joi.string().trim().max(30);
const email = Joi.string().trim().lowercase().email({ tlds: { allow: false } }).allow("", null);

const idParams = Joi.object().keys({
  id: Joi.string().custom(objectId).required(),
});

const getCustomers = {
  query: Joi.object().keys({
    status: Joi.string().valid("all", "active", "expiring", "expired").default("all"),
    bucket: Joi.string().valid("1-3", "4-7", "8-10"), // used only with status=expiring
    q: Joi.string().trim().max(100).allow(""),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    sort: Joi.string().valid("name", "-name", "expiry", "-expiry", "since", "-since"),
  }),
};

const getCustomerStats = {
  query: Joi.object().keys({
    q: Joi.string().trim().max(100).allow(""),
  }),
};

const getCustomer = {
  params: idParams,
};

const createCustomer = {
  body: Joi.object().keys({
    fullName: fullName.required(),
    phone: phone.required(),
    email,
    startDate: Joi.string().custom(dateOnly),
    durationMonths: Joi.number()
      .valid(...DURATION_OPTIONS)
      .required(),
    payment: paymentInput,
  }),
};

const updateCustomer = {
  params: idParams,
  body: Joi.object()
    .keys({
      fullName,
      phone,
      email,
      remindersEnabled: Joi.boolean(),
    })
    .min(1),
};

const deleteCustomer = {
  params: idParams,
};

const renewCustomer = {
  params: idParams,
  body: Joi.object().keys({
    durationMonths: Joi.number()
      .valid(...DURATION_OPTIONS)
      .required(),
    payment: paymentInput,
  }),
};

module.exports = {
  getCustomers,
  getCustomerStats,
  getCustomer,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  renewCustomer,
};
```

## src/validations/index.js

```js
module.exports.authValidation = require("./auth.validation");
module.exports.userValidation = require("./user.validation");
module.exports.customerValidation = require("./customer.validation");
module.exports.paymentValidation = require("./payment.validation");
```

## src/validations/payment.validation.js

```js
const Joi = require("joi");
const { objectId, dateOnly, money } = require("./custom.validation");
const { PAYMENT_METHODS, PAYMENT_STATUSES } = require("../config/business");

// Business rules (paid needs amount > 0, method, paidAt) are enforced in payment.service.
const paymentInput = Joi.object().keys({
  amount: Joi.number().min(0).required().custom(money),
  method: Joi.string()
    .valid(...PAYMENT_METHODS)
    .allow("", null),
  status: Joi.string()
    .valid(...PAYMENT_STATUSES)
    .default("paid"),
  paidAt: Joi.string().custom(dateOnly).allow(null),
  note: Joi.string().trim().max(200).allow("", null),
});

const upsertPayment = {
  params: Joi.object().keys({
    id: Joi.string().custom(objectId).required(),
    renewalId: Joi.string().custom(objectId).required(),
  }),
  body: paymentInput,
};

const getPayments = {
  query: Joi.object().keys({
    status: Joi.string().valid(...PAYMENT_STATUSES),
    from: Joi.string().custom(dateOnly), // filters paidAt
    to: Joi.string().custom(dateOnly), // filters paidAt
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
  }),
};

module.exports = {
  paymentInput,
  upsertPayment,
  getPayments,
};
```

## src/validations/user.validation.js

```js
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
```

## package.json

```json
{
  "name": "nigertoday-tv-backend",
  "version": "1.0.0",
  "description": "REST API for the Nigertoday TV Subscription Manager",
  "main": "src/index.js",
  "engines": {
    "node": ">=24"
  },
  "scripts": {
    "start": "node src/index.js",
    "dev": "nodemon src/index.js",
    "seed": "node src/utils/seeder.js",
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "author": "Md. Jihad Khan",
  "license": "ISC",
  "dependencies": {
    "axios": "^1.6.2",
    "bcryptjs": "^2.4.3",
    "compression": "^1.7.4",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "express": "^4.18.2",
    "express-mongo-sanitize": "^2.2.0",
    "express-rate-limit": "^7.1.3",
    "he": "^1.2.0",
    "helmet": "^7.0.0",
    "http-status": "^1.7.3",
    "joi": "^17.11.0",
    "jsonwebtoken": "^9.0.2",
    "lodash": "^4.17.21",
    "luxon": "^3.7.2",
    "mongoose": "^7.6.3",
    "morgan": "^1.10.0",
    "node-cron": "^3.0.3",
    "nodemailer": "^6.9.7",
    "passport": "^0.6.0",
    "passport-jwt": "^4.0.1",
    "swagger-jsdoc": "^6.2.8",
    "swagger-ui-express": "^5.0.0",
    "validator": "^13.11.0",
    "winston": "^3.11.0"
  },
  "devDependencies": {
    "nodemon": "^3.0.2"
  }
}
```

