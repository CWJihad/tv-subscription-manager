const httpStatus = require("http-status");
const ApiError = require("./ApiError");

const E164_RE = /^\+[1-9]\d{7,14}$/;
const BD_LOCAL_RE = /^0?1[3-9]\d{8}$/;

/** Normalizes to E.164. Throws 400 when invalid. */
const normalizePhone = (input) => {
  const invalid = () => new ApiError(httpStatus.BAD_REQUEST, "Enter a valid phone number");
  if (typeof input !== "string") throw invalid();

  let value = input.replace(/[\s\-.()]/g, "");
  if (value.startsWith("00")) value = `+${value.slice(2)}`;
  else if (value.startsWith("+")) value = value;
  else if (value.startsWith("880")) value = `+${value}`;
  else if (BD_LOCAL_RE.test(value)) value = `+880${value.replace(/^0/, "")}`;

  if (!E164_RE.test(value)) throw invalid();
  return value;
};

const maskPhone = (phone) => (phone ? `***${String(phone).slice(-4)}` : "");

module.exports = {
  normalizePhone,
  maskPhone,
};