const { formatDateOnly } = require("../utils/dates");

/** customerId may be populated with { fullName }. */
const toReminderLogDto = (log) => {
  const customer = log.customerId;
  const hasCustomer = Boolean(customer);
  return {
    id: String(log._id || log.id),
    customerId: hasCustomer ? String(customer._id || customer) : null,
    customerName: hasCustomer && customer.fullName ? customer.fullName : null,
    periodEnd: formatDateOnly(log.periodEnd),
    type: log.type,
    channel: log.channel,
    provider: log.provider,
    status: log.status,
    attempts: log.attempts,
    reason: log.reason || null,
    error: log.error || null,
    providerMessageId: log.providerMessageId || null,
    sentAt: log.sentAt ? new Date(log.sentAt).toISOString() : null,
    to: log.to || null,
    createdAt: log.createdAt ? new Date(log.createdAt).toISOString() : null,
  };
};

module.exports = { toReminderLogDto };