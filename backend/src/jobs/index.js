const reminderJob = require("./reminder.job");
const demoJob = require("./demo.job");

const start = () => {
  reminderJob.start();
  demoJob.start();
};

const stop = () => {
  reminderJob.stop();
  demoJob.stop();
};

module.exports = { start, stop };
