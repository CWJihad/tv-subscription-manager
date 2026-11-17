const cron = require("node-cron");
const config = require("../config/config");
const logger = require("../config/logger");
const reminderService = require("../services/reminder.service");

let task = null;

const tick = async () => {
  try {
    await reminderService.runReminders();
    await reminderService.sendFailureDigest();
  } catch (error) {
    // "run already in progress" is normal when a manual run overlaps.
    logger.warn(`Reminder tick: ${error.message}`);
  }
};

const start = () => {
  if (!config.jobs.enabled || !config.jobs.remindersEnabled) {
    logger.info("Reminder job is off (JOBS_ENABLED / REMINDERS_ENABLED)");
    return;
  }
  if (config.app.demoMode) {
    logger.info("Reminder job is off (DEMO_MODE=true)");
    return;
  }
  if (task) return;
  task = cron.schedule("0 * * * *", tick, { timezone: config.app.timezone });
  logger.info(`Reminder job scheduled (hourly, ${config.app.timezone})`);
  tick(); // also run once at startup
};

const stop = () => {
  if (task) {
    task.stop();
    task = null;
  }
};

module.exports = { start, stop };