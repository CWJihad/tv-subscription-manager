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
  REMINDER_STRATEGIES: Object.freeze(["both", "whatsapp_then_email"]),
  DEFAULT_REMINDER_STRATEGY: "both",
  MAX_REMINDER_ATTEMPTS: 3,
  DIGEST_HOUR: 18,
  // offset = days from today to expiresAt for the customers who get this reminder today
  REMINDER_TYPE_RULES: Object.freeze([
    Object.freeze({ type: "d7", flag: "remind7Days", offset: 7 }),
    Object.freeze({ type: "d3", flag: "remind3Days", offset: 3 }),
    Object.freeze({ type: "d1", flag: "remind1Day", offset: 1 }),
    Object.freeze({ type: "expired", flag: "remindExpired", offset: -1 }),
  ]),
  REMINDER_WHEN_TEXT: Object.freeze({ d7: "in 7 days", d3: "in 3 days", d1: "tomorrow" }),
  DEFAULT_REMINDER_TEMPLATES: Object.freeze({
    d7: "Hi {firstName}, your TV subscription expires on {date} (7 days left). Please renew to keep your service running. Thank you!",
    d3: "Hi {firstName}, your TV subscription expires on {date} (3 days left). Please renew to keep your service running. Thank you!",
    d1: "Hi {firstName}, your TV subscription expires on {date} (1 day left). Please renew to keep your service running. Thank you!",
    expired: "Hi {firstName}, your TV subscription expired on {date}. Please renew to get your service back. Thank you!",
  }),
});