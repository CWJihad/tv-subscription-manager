const httpStatus = require("http-status");
const config = require("../config/config");
const logger = require("../config/logger");
const ApiError = require("../utils/ApiError");
const { maskPhone } = require("../utils/phone");
const { maskEmail } = require("../utils/mask");
const { addDays } = require("../utils/dates");
const { getToday, getNowInZone } = require("../utils/today");
const { getFirstName, formatMessageDate, renderTemplate } = require("../utils/template");
const { shouldForceMock } = require("../utils/seedGuard");
const { Customer, ReminderLog, User } = require("../models");
const {
  MAX_REMINDER_ATTEMPTS,
  DIGEST_HOUR,
  REMINDER_TYPE_RULES,
  REMINDER_WHEN_TEXT,
} = require("../config/business");
const { toReminderLogDto } = require("../serializers/reminder.serializer");
const settingsService = require("./settings.service");
const emailProvider = require("./reminder/providers/email.provider");
const whatsappProvider = require("./reminder/providers/whatsapp.provider");

const PROVIDERS = { email: emailProvider, whatsapp: whatsappProvider };
const CHANNEL_ORDER = ["whatsapp", "email"];

let busy = false;

/* ----------------------------- helpers ----------------------------- */

const maskTarget = (customer, channel) =>
  channel === "email" ? maskEmail(customer.email) : maskPhone(customer.phone);

const buildContent = (customer, type, settings) => {
  const firstName = getFirstName(customer.fullName);
  const date = formatMessageDate(customer.expiresAt);
  const message = renderTemplate(settings.reminderTemplates[type], { firstName, date });
  const params = type === "expired" ? [firstName, date] : [firstName, date, REMINDER_WHEN_TEXT[type]];
  return { message, params };
};

/** Upsert on the unique key { customerId, periodEnd, type, channel }. */
const saveLog = async (customer, type, channel, fields, countAttempt) => {
  const filter = { customerId: customer._id, periodEnd: customer.expiresAt, type, channel };
  const update = { $set: fields };
  if (countAttempt) update.$inc = { attempts: 1 };
  else update.$setOnInsert = { attempts: 0 };
  const options = { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true };
  try {
    return await ReminderLog.findOneAndUpdate(filter, update, options);
  } catch (error) {
    if (!error || error.code !== 11000) throw error;
    return ReminderLog.findOneAndUpdate(filter, update, options);
  }
};

/** Can this channel still be tried? sent and skipped are final, failed retries up to the limit. */
const canTry = (log) => !log || (log.status === "failed" && log.attempts < MAX_REMINDER_ATTEMPTS);

const deliver = async (customer, type, channel, settings) => {
  const { message, params } = buildContent(customer, type, settings);
  const result = await PROVIDERS[channel].send({
    customer,
    type,
    message,
    params,
    forceMock: shouldForceMock(customer),
  });
  await saveLog(
    customer,
    type,
    channel,
    {
      provider: result.provider,
      status: result.status,
      reason: null,
      error: result.error ? String(result.error).slice(0, 300) : null,
      providerMessageId: result.providerMessageId || null,
      sentAt: result.status === "sent" ? new Date() : null,
      to: maskTarget(customer, channel),
    },
    true
  );
  return result;
};

/** One channel for one customer. Returns the send result, or null when nothing was tried. */
const attempt = async (ctx, channel, { fallback = false } = {}) => {
  const { customer, type, settings, dryRun, items } = ctx;
  const log = ctx.logOf(channel);
  if (!canTry(log)) return null;

  const item = (action) => items.push({ customerId: String(customer._id), type, channel, action });

  if (channel === "email" && !customer.email) {
    if (!dryRun) {
      await saveLog(
        customer,
        type,
        channel,
        {
          provider: emailProvider.getProviderName(shouldForceMock(customer)),
          status: "skipped",
          reason: "no_email",
          error: null,
          to: null,
        },
        false
      );
    }
    item(dryRun ? "would_skip_no_email" : "skipped_no_email");
    return { status: "skipped" };
  }

  if (dryRun) {
    const retry = Boolean(log && log.attempts > 0);
    item(fallback ? "would_send_if_whatsapp_fails" : retry ? "would_retry" : "would_send");
    return { status: "planned" };
  }

  const result = await deliver(customer, type, channel, settings);
  item(result.status === "sent" ? "sent" : "failed");
  return result;
};

/** whatsapp_then_email: email only when WhatsApp did not deliver. */
const runFallback = async (ctx) => {
  const whatsappLog = ctx.logOf("whatsapp");
  const emailLog = ctx.logOf("email");
  if ((whatsappLog && whatsappLog.status === "sent") || (emailLog && emailLog.status === "sent")) return;

  const whatsappResult = await attempt(ctx, "whatsapp");
  if (ctx.dryRun) {
    await attempt(ctx, "email", { fallback: whatsappResult !== null });
    return;
  }
  if (whatsappResult && whatsappResult.status === "sent") return;

  const emailResult = await attempt(ctx, "email");
  if (emailResult && emailResult.status === "sent") {
    await ReminderLog.updateOne(
      { customerId: ctx.customer._id, periodEnd: ctx.customer.expiresAt, type: ctx.type, channel: "whatsapp", status: "failed" },
      { $set: { reason: "fallback_sent" } }
    );
  }
};

const processCustomer = async ({ customer, type, settings, dryRun, items }) => {
  const channels = CHANNEL_ORDER.filter((channel) => settings.reminderChannels.includes(channel));
  if (channels.length === 0) return;

  const logs = await ReminderLog.find({ customerId: customer._id, periodEnd: customer.expiresAt, type }).lean();
  const ctx = {
    customer,
    type,
    settings,
    dryRun,
    items,
    logOf: (channel) => logs.find((log) => log.channel === channel) || null,
  };

  if (settings.reminderStrategy === "whatsapp_then_email" && channels.length === 2) {
    await runFallback(ctx);
    return;
  }
  for (const channel of channels) {
    await attempt(ctx, channel);
  }
};

/* ------------------------------ engine ------------------------------ */

const doRun = async ({ dryRun, ignoreSendHour }) => {
  const settings = await settingsService.getSettings();
  const now = getNowInZone();
  if (!ignoreSendHour && now.hour < settings.reminderSendHour) {
    return { dryRun, items: [] };
  }

  const today = getToday();
  const items = [];
  const targets = REMINDER_TYPE_RULES.filter((rule) => settings[rule.flag]).map((rule) => ({
    type: rule.type,
    date: addDays(today, rule.offset),
  }));

  for (const target of targets) {
    const customers = await Customer.find({ expiresAt: target.date, remindersEnabled: true })
      .sort({ _id: 1 })
      .lean();
    for (const customer of customers) {
      try {
        await processCustomer({ customer, type: target.type, settings, dryRun, items });
      } catch (error) {
        // One bad customer never stops the loop.
        logger.error(`Reminder ${target.type} failed for ${maskPhone(customer.phone)}: ${error.message}`);
      }
    }
  }
  return { dryRun, items };
};

/** Shared by the cron job and the manual endpoint. One run at a time. */
const runReminders = async ({ dryRun = false, ignoreSendHour = false } = {}) => {
  if (busy) throw new ApiError(httpStatus.CONFLICT, "A reminder run is already in progress");
  busy = true;
  try {
    return await doRun({ dryRun, ignoreSendHour });
  } finally {
    busy = false;
  }
};

const assertCanSend = () => {
  if (config.app.demoMode) {
    throw new ApiError(httpStatus.FORBIDDEN, "Reminders are disabled in demo mode");
  }
  if (!config.jobs.remindersEnabled) {
    throw new ApiError(httpStatus.FORBIDDEN, "Reminders are disabled. Set REMINDERS_ENABLED=true");
  }
};

/** POST /reminders/run. Ignores reminderSendHour. dryRun never sends or writes. */
const runManually = async ({ dryRun }) => {
  if (!dryRun) assertCanSend();
  return runReminders({ dryRun, ignoreSendHour: true });
};

/* ------------------------------ digest ------------------------------ */

/** Daily email to the admin with the reminders that gave up today (attempts used up, no fallback). */
const sendFailureDigest = async ({ dryRun = false, force = false } = {}) => {
  const result = (extra) => ({ dryRun, sent: false, failedCount: 0, ...extra });
  if (config.app.demoMode) return result({ reason: "demo_mode" });

  const settings = await settingsService.getSettingsDoc();
  if (!force) {
    if (!settings.failureDigestEnabled) return result({ reason: "disabled" });
    if (getNowInZone().hour < DIGEST_HOUR) return result({ reason: "before_digest_hour" });
    const today = getToday();
    if (settings.lastDigestOn && settings.lastDigestOn.getTime() === today.getTime()) {
      return result({ reason: "already_sent_today" });
    }
  }

  const since = getNowInZone().startOf("day").toJSDate();
  const failed = await ReminderLog.find({
    status: "failed",
    attempts: { $gte: MAX_REMINDER_ATTEMPTS },
    reason: { $ne: "fallback_sent" },
    updatedAt: { $gte: since },
  })
    .sort({ updatedAt: 1 })
    .limit(100)
    .populate("customerId", "fullName")
    .lean();

  if (failed.length === 0) return result({ reason: "nothing_to_report" });
  if (dryRun) return result({ failedCount: failed.length, reason: "dry_run" });

  const admin = await User.findOne({ role: "admin", isDeleted: false }).sort({ createdAt: 1 });
  if (!admin || !admin.email) return result({ failedCount: failed.length, reason: "no_admin_email" });

  const lines = failed.map((log) => {
    const name = log.customerId && log.customerId.fullName ? log.customerId.fullName : "Unknown";
    return `- ${name} | ${log.channel} | ${log.type} | to ${log.to || "-"} | ${log.error || "unknown error"}`;
  });
  const text = [
    `${failed.length} reminder(s) could not be delivered today after ${MAX_REMINDER_ATTEMPTS} attempts:`,
    "",
    ...lines,
    "",
    "Contact these customers manually.",
  ].join("\n");

  const sendResult = await emailProvider.sendMail({
    to: admin.email,
    subject: `Reminder failures: ${failed.length} not delivered`,
    text,
    forceMock: Boolean(config.app.mockToday),
  });
  if (sendResult.status === "sent") await settingsService.markDigestSent(getToday());
  return { dryRun, sent: sendResult.status === "sent", failedCount: failed.length, reason: sendResult.error || null };
};

/** POST /reminders/digest. Ignores the hour and the once-a-day check. */
const sendDigestManually = async ({ dryRun }) => {
  if (!dryRun) assertCanSend();
  return sendFailureDigest({ dryRun, force: true });
};

/* ------------------------------- logs ------------------------------- */

const listLogs = async ({ customerId, status, type, channel, page, limit }) => {
  const filter = {};
  if (customerId) filter.customerId = customerId;
  if (status) filter.status = status;
  if (type) filter.type = type;
  if (channel) filter.channel = channel;

  const result = await ReminderLog.paginate(filter, {
    sortBy: "createdAt:desc,_id:desc",
    page,
    limit,
    populate: "customerId fullName",
  });
  return { ...result, results: result.results.map(toReminderLogDto) };
};

const listCustomerReminders = async (customerId) => {
  if (!(await Customer.exists({ _id: customerId }))) {
    throw new ApiError(httpStatus.NOT_FOUND, "Customer not found");
  }
  const logs = await ReminderLog.find({ customerId }).sort({ createdAt: -1, _id: -1 }).limit(100).lean();
  return { results: logs.map(toReminderLogDto) };
};

module.exports = {
  runReminders,
  runManually,
  sendFailureDigest,
  sendDigestManually,
  listLogs,
  listCustomerReminders,
};