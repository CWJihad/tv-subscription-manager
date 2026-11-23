// Demo only: nightly reseed so the demo always looks fresh and starts clean.
// Runs only when DEMO_MODE=true and JOBS_ENABLED=true. One PM2 instance only.
const cron = require("node-cron");
const config = require("../config/config");
const logger = require("../config/logger");
const seedService = require("../services/seed.service");

let task = null;
let busy = false;

const reseed = async (reason) => {
  if (busy) return;
  busy = true;
  try {
    const totals = await seedService.seedDatabase({ demo: true });
    logger.info(
      `Demo data reseeded (${reason}): ${totals.customers} customers, ${totals.renewals} renewals, ${totals.payments} payments`
    );
  } catch (error) {
    // Includes the "database name must contain demo" guard.
    logger.error(`Demo reseed failed: ${error.message}`);
  } finally {
    busy = false;
  }
};

const start = () => {
  if (!config.app.demoMode) return;
  if (!config.jobs.enabled) {
    logger.info("Demo reseed job is off (JOBS_ENABLED=false)");
    return;
  }
  if (task) return;

  task = cron.schedule(`0 ${config.app.demoReseedHour} * * *`, () => reseed("nightly"), {
    timezone: config.app.timezone,
  });
  logger.info(`Demo reseed job scheduled (daily at ${config.app.demoReseedHour}:00, ${config.app.timezone})`);

  // First start on an empty demo database: seed once.
  seedService
    .isDatabaseEmpty()
    .then((empty) => (empty ? reseed("empty database") : null))
    .catch((error) => logger.error(`Demo startup check failed: ${error.message}`));
};

const stop = () => {
  if (task) {
    task.stop();
    task = null;
  }
};

module.exports = { start, stop };
