// Seeder: owner from .env, settings, 30 customers with renewals and payments.
// Full reset of business data. Refuses to run in production without SEED_FORCE=yes.
const mongoose = require("mongoose");
const config = require("../config/config");
const { CURRENCY } = require("../config/business");
const { User, Customer, Renewal, Payment, Settings, ReminderLog, Token } = require("../models");
const { parseDateOnly } = require("./dates");
const {
  PRICES,
  OWNER_NAME,
  EXPECTED_MOCK_TODAY,
  UNPAID_RENEWAL_NUMBER,
  NO_PAYMENT_RENEWAL_NUMBER,
  SEED_CUSTOMERS,
} = require("./seedData");

const requireEnv = () => {
  if (config.env === "production" && config.seed.force !== "yes") {
    console.error("Refusing to seed in production. Set SEED_FORCE=yes to override.");
    process.exit(1);
  }
  const { adminEmail, adminPassword } = config.seed;
  if (!adminEmail || !adminPassword) {
    console.error("SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD must be set in .env");
    process.exit(1);
  }
  if (config.app.mockToday !== EXPECTED_MOCK_TODAY) {
    console.warn(`Warning: seed dates assume MOCK_TODAY=${EXPECTED_MOCK_TODAY}. Current value: ${config.app.mockToday || "(not set)"}`);
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
const seedCustomers = async () => {
  let renewalNumber = 0;
  let paymentCount = 0;

  for (const item of SEED_CUSTOMERS) {
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

  return { customers: SEED_CUSTOMERS.length, renewals: renewalNumber, payments: paymentCount };
};

const run = async () => {
  requireEnv();
  await mongoose.connect(config.mongoose.url, config.mongoose.options);
  try {
    await resetData();
    await seedOwner();
    await seedSettings();
    const totals = await seedCustomers();
    console.log(
      `Seeded: owner, settings, ${totals.customers} customers, ${totals.renewals} renewals, ${totals.payments} payments.`
    );
  } finally {
    await mongoose.disconnect();
  }
};

run().catch((error) => {
  console.error("Seeding failed:", error.message);
  process.exit(1);
});