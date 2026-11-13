const { Settings } = require("../models");
const { toSettingsDto } = require("../serializers/settings.serializer");

const SETTINGS_KEY = "main";

const isDuplicateKey = (error) => Boolean(error) && error.code === 11000;

/** Single settings document. Created with defaults on first use. */
const getSettingsDoc = async () => {
  const existing = await Settings.findOne({ key: SETTINGS_KEY });
  if (existing) return existing;
  try {
    return await Settings.create({ key: SETTINGS_KEY });
  } catch (error) {
    if (!isDuplicateKey(error)) throw error;
    // Another request created it first.
    return Settings.findOne({ key: SETTINGS_KEY });
  }
};

/** { a: { b: 1 } } -> { "a.b": 1 }. Arrays are kept as values. */
const flatten = (object, prefix = "") =>
  Object.entries(object).reduce((acc, [key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === "object" && !Array.isArray(value)) {
      Object.assign(acc, flatten(value, path));
    } else {
      acc[path] = value;
    }
    return acc;
  }, {});

const getSettings = async () => toSettingsDto(await getSettingsDoc());

/** Partial update. Nested objects (templates, prices) are merged field by field. */
const updateSettings = async (body) => {
  await getSettingsDoc();
  const updated = await Settings.findOneAndUpdate(
    { key: SETTINGS_KEY },
    { $set: flatten(body) },
    { new: true, runValidators: true }
  );
  return toSettingsDto(updated);
};

module.exports = {
  getSettings,
  updateSettings,
};