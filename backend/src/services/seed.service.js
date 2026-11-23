// Seeding logic shared by the CLI (utils/seeder.js) and the nightly demo job (jobs/demo.job.js).
const mongoose = require("mongoose");
const config = require("../config/config");
const { CURRENCY } = require("../config/business");
const { User, Customer, Renewal, Payment, Settings, ReminderLog, Token } = require("../models");
const { parseDateOnly } = require("../utils/dates");
const { getToday } = require("../utils/today");
const { buildDemoCustomers } = require("../utils/demoDates");
const {
  PRICES,
  OWNER_NAME,
  UNPAID_RENEWAL_NUMBER,
  NO_PAYMENT_RENEWAL_NUMBER,
  SEED_CUSTOMERS,
} = require("../utils/seedData");

const assertAdminEnv = () => {
  const { adminEmail, adminPassword } = config.seed;
  if (!adminEmail || !adminPassword) {
    throw new Error("SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD must be set in .env");
  }
};

/** A reseed wipes everything, so it only runs on a database that is clearly a demo one. */
const assertDemoDatabase = () => {
  if (!config.app.demoMode) {
    throw new Error("Demo seeding needs DEMO_MODE=true");
  }
  const name = mongoose.connection.name || "";
  if (!/demo/i.test(name)) {
    throw new Error(`Refusing to wipe database "${name}": a demo database name must contain "demo"`);
  }
};

const resetData = async () => {
  await Promise.all([
    Customer.deleteMany({}),
    Renewal.deleteMany({}),
    Payment.deleteMany({}),
    ReminderLog.deleteMany({}),
    Settings.deleteMany({}),
    Token.deleteMany({}),
  ]);
};

const seedOwner = async () => {
  const { adminEmail, adminPassword } = config.seed;
  await User.deleteMany({ email: adminEmail.toLowerCase() });
  await User.create({
    fullName: OWNER_NAME,
    email: adminEmail,
    password: adminPassword,
    role: "admin",
    isEmailVerified: true,
  });
};

const seedSettings = async () =>
  Settings.create({ key: "main", prices: { m3: PRICES[3], m6: PRICES[6], m12: PRICES[12] } });

/** One paid payment per renewal (odd number = cash, even = bkash), with two exceptions. */
const buildSeedPayment = (renewalNumber, renewal) => {
  if (renewalNumber === NO_PAYMENT_RENEWAL_NUMBER) return null;
  const amount = PRICES[renewal.durationMonths];
  if (renewalNumber === UNPAID_RENEWAL_NUMBER) {
    return { amount, currency: CURRENCY, method: null, status: "unpaid", paidAt: null };
  }
  return {
    amount,
    currency: CURRENCY,
    method: renewalNumber % 2 === 1 ? "cash" : "bkash",
    status: "paid",
    paidAt: parseDateOnly(renewal.from),
  };
};

/** Sequential inserts keep _id order equal to the frontend list order (c_001 ... c_030). */
const seedCustomers = async (customers) => {
  let renewalNumber = 0;
  let paymentCount = 0;

  for (const item of customers) {
    const customer = await Customer.create({
      fullName: item.fullName,
      email: item.email,
      phone: item.phone,
      startDate: parseDateOnly(item.currentStartDate),
      durationMonths: item.durationMonths,
      expiresAt: parseDateOnly(item.expiryDate),
      remindersEnabled: true,
      createdAt: parseDateOnly(item.customerSince),
    });

    for (const renewalItem of item.renewals) {
      renewalNumber += 1;
      const renewal = await Renewal.create({
        customerId: customer._id,
        type: renewalItem.kind === "first" ? "initial" : "renewal",
        periodStart: parseDateOnly(renewalItem.from),
        periodEnd: parseDateOnly(renewalItem.to),
        durationMonths: renewalItem.durationMonths,
      });

      const fields = buildSeedPayment(renewalNumber, renewalItem);
      if (fields) {
        await Payment.create({ customerId: customer._id, renewalId: renewal._id, ...fields });
        paymentCount += 1;
      }
    }
  }

  return { customers: customers.length, renewals: renewalNumber, payments: paymentCount };
};

/**
 * Full reset, then owner, settings, 30 customers.
 * demo = true: dates are moved to today (utils/demoDates.js) and the demo-database guard applies.
 */
const seedDatabase = async ({ demo = false } = {}) => {
  assertAdminEnv();
  if (demo) assertDemoDatabase();
  const customers = demo ? buildDemoCustomers(SEED_CUSTOMERS, getToday()) : SEED_CUSTOMERS;

  await resetData();
  await seedOwner();
  await seedSettings();
  return seedCustomers(customers);
};

const isDatabaseEmpty = async () => !(await Customer.exists({}));

module.exports = {
  seedDatabase,
  isDatabaseEmpty,
};
