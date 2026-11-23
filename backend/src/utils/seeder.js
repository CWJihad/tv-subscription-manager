// Seeder CLI.
//   npm run seed       fixed dates (dev, MOCK_TODAY=2026-10-05). Refuses production without SEED_FORCE=yes.
//   npm run seed:demo  dates relative to today. Needs DEMO_MODE=true and a database name that contains "demo".
const mongoose = require("mongoose");
const config = require("../config/config");
const { EXPECTED_MOCK_TODAY } = require("./seedData");
const seedService = require("../services/seed.service");

const demo = process.argv.includes("--demo");

const fail = (message) => {
  console.error(message);
  process.exit(1);
};

const checkEnv = () => {
  if (demo) {
    if (!config.app.demoMode) fail("npm run seed:demo needs DEMO_MODE=true in .env");
  } else {
    if (config.env === "production" && config.seed.force !== "yes") {
      fail("Refusing to seed in production. Set SEED_FORCE=yes to override.");
    }
    if (config.app.demoMode) {
      console.warn("Warning: DEMO_MODE=true. Use npm run seed:demo so the dates follow today.");
    }
    if (config.app.mockToday !== EXPECTED_MOCK_TODAY) {
      console.warn(
        `Warning: seed dates assume MOCK_TODAY=${EXPECTED_MOCK_TODAY}. Current value: ${config.app.mockToday || "(not set)"}`
      );
    }
  }
  const { adminEmail, adminPassword } = config.seed;
  if (!adminEmail || !adminPassword) fail("SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD must be set in .env");
};

const run = async () => {
  checkEnv();
  await mongoose.connect(config.mongoose.url, config.mongoose.options);
  try {
    const totals = await seedService.seedDatabase({ demo });
    console.log(
      `Seeded${demo ? " (demo, dates relative to today)" : ""}: owner, settings, ${totals.customers} customers, ${totals.renewals} renewals, ${totals.payments} payments.`
    );
  } finally {
    await mongoose.disconnect();
  }
};

run().catch((error) => {
  console.error("Seeding failed:", error.message);
  process.exit(1);
});
