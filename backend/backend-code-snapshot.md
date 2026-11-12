# Code snapshot
Generated: 2026-11-12T16:39:06.440Z

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
const { customerService } = require("../services");

const createCustomer = catchAsync(async (req, res) => {
  const customer = await customerService.createCustomer(req.body);
  res.status(httpStatus.CREATED).json(
    response({
      message: "customer Created",
      status: "OK",
      statusCode: httpStatus.CREATED,
      data: customer,
    })
  );
});

module.exports = {
  createCustomer
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
module.exports.renewalController = require('./renewal.controller');
module.exports.healthController = require('./health.controller');
```

## src/controllers/renewal.controller.js

```js
const httpStatus = require("http-status");
const catchAsync = require("../utils/catchAsync");
const response = require("../config/response");
const { customerService } = require("../services");

const createCustomer = catchAsync(async (req, res) => {
  const customer = await customerService.createCustomer(req.body);
  res.status(httpStatus.CREATED).json(
    response({
      message: "customer Created",
      status: "OK",
      statusCode: httpStatus.CREATED,
      data: customer,
    })
  );
});

module.exports = {
  createCustomer
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

## src/models/aboutUs.model.js

```js
const mongoose = require("mongoose");

const aboutUsSchema = new mongoose.Schema(
  {
    content: { 
      type: String, 
      required: [true, "Content is required"], 
      minlength: 10, 
      maxlength: 2000
    },
  },
  { 
    timestamps: true,
    versionKey: false
  }
);

module.exports = mongoose.model("AboutUs", aboutUsSchema);

```

## src/models/customer.model.js

```js
const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const { toJSON, paginate } = require("./plugins");

const customerSchema = mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
      default: null,
    },
    phone: {
        type: String,
        required: true,
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
    startDate: {
        type: Date,
        required: false,
        default: null
    },
    durationMonths: {
        type: Number,
        required: false,
        default: null
    },
    expiredAt: {
        type: Date,
        required: false,
        default: null
    },
    isDeleted: {
      type: Boolean,
      default: false
    }
    },
  {
    timestamps: true,
  }
);

// add plugin that converts mongoose to json
customerSchema.plugin(toJSON);
customerSchema.plugin(paginate);

customerSchema.statics.isEmailTaken = async function (email, excludeUserId) {
  const customer = await this.findOne({ email, _id: { $ne: excludeUserId } });
  return !!customer;
};

customerSchema.methods.isPasswordMatch = async function (password) {
  const customer = this;
  return bcrypt.compare(password, customer.password);
};

customerSchema.pre("save", async function (next) {
  const customer = this;
  if (customer.isModified("password")) {
    customer.password = await bcrypt.hash(customer.password, 8);
  }
  next();
});

const Customer = mongoose.model("Customer", customerSchema);

module.exports = Customer;

```

## src/models/index.js

```js
module.exports.Token = require('./token.model');
module.exports.User = require('./user.model');
module.exports.Customer = require('./customer.model');
module.exports.Renewal = require('./renewal.model');


module.exports.Notification = require('./notification.model');
module.exports.TermsAndCondition = require('./termsConditions.model');
module.exports.AboutUs = require('./aboutUs.model');
module.exports.PrivacyPolicy = require('./privacyPolicy.model');
module.exports.Support = require('./support.model');
```

## src/models/notification.model.js

```js
const mongoose = require('mongoose');
const { Schema } = mongoose;
const { roles } = require("../config/roles");

const notificationSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    sendBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: false
    },
    transactionId: {
        type: String,
        required: false,
        default: null
    },
    role: {
        type: String,
        required: false,
        enum: roles,
        default: null,
    },
    title: {
        type: String,
    },
    content: {
        type: String,
        required: true
    },
    icon: {
        type: String,
        required: false
    },
    devStatus: {
        type: String,
        required: false
    },
    image: {
        type: String,
        required: false
    },
    status: {
        type: String,
        enum: ['unread', 'read'],
        default: 'unread'
    },
    type: {
        type: String,
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium'
    },
},
    {
        timestamps: true
    });

module.exports = mongoose.model("Notification", notificationSchema);

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

## src/models/privacyPolicy.model.js

```js
const mongoose = require("mongoose");

const privacySchema = new mongoose.Schema(
    {
        content: { type: String, required: [true, "Content is must be Required"] },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Privacy", privacySchema);

```

## src/models/renewal.model.js

```js
const mongoose = require("mongoose");
const { toJSON, paginate } = require("./plugins");

const renewalSchema = mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer"
    },
    periodStart: {
      type: Date,
    },
    periodEnd: {
      type: Date,
    },
    durationMonth: {
      type: Number,
    },
    type: {
      type: String,
      enum: ['initial', 'renewal']
    },
  },
  {
    timestamps: true,
  },
);

// add plugin that converts mongoose to json
renewalSchema.plugin(toJSON);
renewalSchema.plugin(paginate);

const Renewal = mongoose.model("Renewal", renewalSchema);

module.exports = Renewal;

```

## src/models/support.model.js

```js
const mongoose = require("mongoose");

const supportSchema = new mongoose.Schema(
  {
    content: { 
      type: String, 
      required: [true, "Content is required"], 
      minlength: 10, 
      maxlength: 2000
    },
  },
  { 
    timestamps: true,
    versionKey: false
  }
);

module.exports = mongoose.model("Support", supportSchema);

```

## src/models/termsConditions.model.js

```js
const mongoose = require("mongoose");

const termsSchema = new mongoose.Schema(
  {
    content: { 
      type: String, 
      required: [true, "Content is required"], 
      minlength: 10, 
      maxlength: 2000
    },
  },
  { 
    timestamps: true,
    versionKey: false 
  }
);

module.exports = mongoose.model("TermsConditions", termsSchema);

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
const { customerController } = require("../../controllers");

const router = express.Router();

router.route("/create").post(auth("admin"), customerController.createCustomer);

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
```

## src/routes/v1/renewal.route.js

```js
const express = require("express");
const auth = require("../../middlewares/auth");
const { renewalController } = require("../../controllers");

const router = express.Router();

router.route("/create").post(auth("admin"), renewalController.createCustomer);

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
const { Customer } = require("../models");
const ApiError = require("../utils/ApiError");

const createCustomer = async (userBody) => {
  if (await Customer.isEmailTaken(userBody.email)) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Email already taken");
  }

  return Customer.create({ ...userBody });

};

module.exports = {
  createCustomer
};
```

## src/services/index.js

```js
module.exports.authService = require('./auth.service');
module.exports.tokenService = require('./token.service');
module.exports.userService = require('./user.service');
module.exports.customerService = require('./customer.service');
```

## src/services/renewal.service.js

```js
const Renewal = require("../models/renewal.model");

const createRenewal = async (renewalBody) => {
  const renewal = await Renewal.create({ ...renewalBody });
  return renewal;
};

module.exports = {
  createRenewal,
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
const objectId = (value, helpers) => {
    if (!value.match(/^[0-9a-fA-F]{24}$/)) {
      return helpers.message('"{{#label}}" must be a valid mongo id');
    }
    return value;
  };
  
  const password = (value, helpers) => {
    if (value.length < 8) {
      return helpers.message('password must be at least 8 characters');
    }
    if (!value.match(/\d/) || !value.match(/[a-zA-Z]/)) {
      return helpers.message('password must contain at least 1 letter and 1 number');
    }
    return value;
  };
  
  module.exports = {
    objectId,
    password,
  };
```

## src/validations/index.js

```js
module.exports.authValidation = require('./auth.validation');
module.exports.userValidation = require('./user.validation');


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

