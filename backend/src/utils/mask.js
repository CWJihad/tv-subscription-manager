/** "john@email.com" -> "j***@email.com" (for logs and ReminderLog.to). */
const maskEmail = (email) => {
  if (!email || !String(email).includes("@")) return "";
  const [local, domain] = String(email).split("@");
  return `${local.slice(0, 1)}***@${domain}`;
};

module.exports = { maskEmail };