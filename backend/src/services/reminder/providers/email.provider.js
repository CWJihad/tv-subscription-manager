const nodemailer = require("nodemailer");
const config = require("../../../config/config");
const logger = require("../../../config/logger");
const { maskEmail } = require("../../../utils/mask");

const SUBJECTS = {
  d7: "Your TV subscription expires soon",
  d3: "Your TV subscription expires soon",
  d1: "Your TV subscription expires soon",
  expired: "Your TV subscription has expired",
};

let transporter = null;

const isSmtp = (forceMock) => config.email.provider === "smtp" && !forceMock;

const getProviderName = (forceMock = false) => (isSmtp(forceMock) ? "smtp" : "mock");

const getTransporter = () => {
  if (!transporter) {
    const { host, port, auth } = config.email.smtp;
    transporter = nodemailer.createTransport({
      host,
      port: Number(port),
      secure: Number(port) === 465,
      ...(auth.user && auth.pass ? { auth } : {}),
    });
  }
  return transporter;
};

/** Never throws. Returns { status, provider, providerMessageId, error }. */
const sendMail = async ({ to, subject, text, forceMock = false }) => {
  if (!isSmtp(forceMock)) {
    logger.info(`[mock email] to=${maskEmail(to)} subject="${subject}"`);
    // Test hook (mock only): an address starting with "fail@" fails.
    if (String(to).toLowerCase().startsWith("fail@")) {
      return { status: "failed", provider: "mock", providerMessageId: null, error: "Mock email failure" };
    }
    return { status: "sent", provider: "mock", providerMessageId: `mock-email-${Date.now()}`, error: null };
  }
  try {
    const info = await getTransporter().sendMail({ from: config.email.from, to, subject, text });
    return { status: "sent", provider: "smtp", providerMessageId: info.messageId || null, error: null };
  } catch (error) {
    logger.error(`Email send failed to ${maskEmail(to)}: ${error.message}`);
    return { status: "failed", provider: "smtp", providerMessageId: null, error: error.message };
  }
};

const send = ({ customer, type, message, forceMock = false }) =>
  sendMail({ to: customer.email, subject: SUBJECTS[type], text: message, forceMock });

module.exports = { send, sendMail, getProviderName };