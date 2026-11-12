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