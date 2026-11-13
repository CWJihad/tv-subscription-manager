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