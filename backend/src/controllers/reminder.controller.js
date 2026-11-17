const httpStatus = require("http-status");
const catchAsync = require("../utils/catchAsync");
const response = require("../config/response");
const { reminderService } = require("../services");

const send = (res, message, data) =>
  res.status(httpStatus.OK).json(response({ message, statusCode: httpStatus.OK, type: "reminder", data }));

const run = catchAsync(async (req, res) => {
  send(res, "Reminder run", await reminderService.runManually({ dryRun: req.query.dryRun }));
});

const digest = catchAsync(async (req, res) => {
  send(res, "Failure digest", await reminderService.sendDigestManually({ dryRun: req.query.dryRun }));
});

const listLogs = catchAsync(async (req, res) => {
  send(res, "Reminder logs", await reminderService.listLogs(req.query));
});

const listCustomerReminders = catchAsync(async (req, res) => {
  send(res, "Customer reminders", await reminderService.listCustomerReminders(req.params.id));
});

module.exports = {
  run,
  digest,
  listLogs,
  listCustomerReminders,
};