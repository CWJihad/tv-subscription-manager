const config = require("../config/config");

const SEED_PHONE_RE = /^\+88017000000\d{2}$/;
const SEED_EMAIL_SUFFIX = "@email.com";

/** Seeded / demo contacts (seedData.js). */
const isSeedContact = (customer) =>
  SEED_PHONE_RE.test(customer.phone || "") || String(customer.email || "").endsWith(SEED_EMAIL_SUFFIX);

/** Real providers are never used for seed contacts, or while MOCK_TODAY is set (dev). */
const shouldForceMock = (customer) => Boolean(config.app.mockToday) || isSeedContact(customer);

module.exports = { isSeedContact, shouldForceMock };