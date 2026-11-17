const axios = require("axios");
const config = require("../../../config/config");
const logger = require("../../../config/logger");
const { maskPhone } = require("../../../utils/phone");

const isCloud = (forceMock) => config.whatsapp.provider === "cloud" && !forceMock;

const getProviderName = (forceMock = false) => (isCloud(forceMock) ? "whatsapp_cloud" : "mock");

const failed = (provider, error) => ({ status: "failed", provider, providerMessageId: null, error });

/** Never throws. params = [firstName, expiryDate, whenText?]. Returns { status, provider, providerMessageId, error }. */
const send = async ({ customer, type, params, forceMock = false }) => {
  if (!isCloud(forceMock)) {
    logger.info(`[mock whatsapp] type=${type} to=${maskPhone(customer.phone)}`);
    // Test hook (mock only): a phone ending in 0000 fails.
    if (String(customer.phone).endsWith("0000")) return failed("mock", "Mock WhatsApp failure");
    return { status: "sent", provider: "mock", providerMessageId: `mock-wa-${Date.now()}`, error: null };
  }

  const templateName = type === "expired" ? config.whatsapp.templateNameExpired : config.whatsapp.templateName;
  if (!templateName) return failed("whatsapp_cloud", `WhatsApp template name is not configured for ${type}`);

  const { phoneNumberId, apiVersion, token, templateLang } = config.whatsapp;
  const url = `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`;
  const body = {
    messaging_product: "whatsapp",
    to: String(customer.phone).replace(/\D/g, ""),
    type: "template",
    template: {
      name: templateName,
      language: { code: templateLang },
      components: [{ type: "body", parameters: params.map((text) => ({ type: "text", text: String(text) })) }],
    },
  };

  try {
    const response = await axios.post(url, body, {
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      timeout: 10000,
    });
    const id = response.data && response.data.messages && response.data.messages[0] && response.data.messages[0].id;
    return { status: "sent", provider: "whatsapp_cloud", providerMessageId: id || null, error: null };
  } catch (error) {
    const apiMessage = error.response && error.response.data && error.response.data.error && error.response.data.error.message;
    const message = apiMessage || (error.response ? `WhatsApp request failed (${error.response.status})` : "WhatsApp request failed");
    logger.error(`WhatsApp send failed to ${maskPhone(customer.phone)}: ${message}`);
    return failed("whatsapp_cloud", message);
  }
};

module.exports = { send, getProviderName };