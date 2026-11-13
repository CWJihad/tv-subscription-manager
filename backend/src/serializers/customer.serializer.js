const { formatDateOnly } = require("../utils/dates");
const { getStatus } = require("../utils/status");

const idOf = (doc) => String(doc._id || doc.id);
const dateOrNull = (date) => (date ? formatDateOnly(date) : null);

const toPaymentDto = (payment) =>
  payment
    ? {
        id: idOf(payment),
        amount: payment.amount,
        currency: payment.currency,
        method: payment.method || null,
        status: payment.status,
        paidAt: dateOrNull(payment.paidAt),
        note: payment.note || null,
      }
    : null;

/** Payment list item (GET /payments). customerId may be populated with { fullName }. */
const toPaymentListItem = (payment) => {
  const customer = payment.customerId;
  const hasCustomer = Boolean(customer);
  return {
    ...toPaymentDto(payment),
    renewalId: String(payment.renewalId),
    customerId: hasCustomer ? String(customer._id || customer) : null,
    customerName: hasCustomer && customer.fullName ? customer.fullName : null,
  };
};

const toRenewalItem = (renewal, payment) => ({
  id: idOf(renewal),
  kind: renewal.type === "initial" ? "first" : "renewal",
  durationMonths: renewal.durationMonths,
  from: formatDateOnly(renewal.periodStart),
  to: formatDateOnly(renewal.periodEnd),
  payment: toPaymentDto(payment),
});

const toCustomerListItem = (customer, today) => {
  const { status, daysLeft } = getStatus(customer.expiresAt, today);
  return {
    id: idOf(customer),
    fullName: customer.fullName,
    email: customer.email || "", // frontend type is string
    phone: customer.phone,
    customerSince: formatDateOnly(customer.createdAt),
    currentStartDate: formatDateOnly(customer.startDate),
    durationMonths: customer.durationMonths,
    expiryDate: formatDateOnly(customer.expiresAt),
    status,
    daysLeft,
    remindersEnabled: customer.remindersEnabled,
  };
};

/** renewals and payments are arrays of docs (or lean objects) for this customer. */
const toCustomerDetail = (customer, renewals, payments, today) => {
  const paymentByRenewal = new Map(payments.map((payment) => [String(payment.renewalId), payment]));
  const sorted = [...renewals].sort(
    (a, b) => a.periodStart - b.periodStart || String(a._id).localeCompare(String(b._id))
  );
  return {
    ...toCustomerListItem(customer, today),
    renewals: sorted.map((renewal) => toRenewalItem(renewal, paymentByRenewal.get(idOf(renewal)))),
  };
};

module.exports = {
  toPaymentDto,
  toPaymentListItem,
  toRenewalItem,
  toCustomerListItem,
  toCustomerDetail,
};