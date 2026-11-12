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