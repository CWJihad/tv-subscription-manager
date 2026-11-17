const reminderJob = require("./reminder.job");

const start = () => {
  reminderJob.start();
};

const stop = () => {
  reminderJob.stop();
};

module.exports = { start, stop };