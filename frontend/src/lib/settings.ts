// Pure settings helpers: defaults, template rendering, validation, diff for PATCH /settings.

import { parseAmount } from "@/lib/payment";
import type {
  PriceKey,
  ReminderChannel,
  ReminderTemplates,
  Settings,
  SettingsFormErrors,
  SettingsFormValues,
  TemplateKey,
  ToggleKey,
  UpdateSettingsInput,
} from "@/types";

export const TEMPLATE_MAX_LENGTH = 500;
const ALLOWED_PLACEHOLDERS: readonly string[] = ["firstName", "date"];

export const TOGGLE_KEYS: readonly ToggleKey[] = [
  "remind7Days",
  "remind3Days",
  "remind1Day",
  "remindExpired",
];
export const TEMPLATE_KEYS: readonly TemplateKey[] = ["d7", "d3", "d1", "expired"];
export const PRICE_KEYS: readonly PriceKey[] = ["m3", "m6", "m12"];
export const CHANNEL_ORDER: readonly ReminderChannel[] = ["email", "whatsapp"];

export const CHANNEL_LABELS: Record<ReminderChannel, string> = {
  email: "Email",
  whatsapp: "WhatsApp",
};

export const TEMPLATE_LABELS: Record<TemplateKey, string> = {
  d7: "7 days left",
  d3: "3 days left",
  d1: "1 day left",
  expired: "Expired",
};

export const PRICE_LABELS: Record<PriceKey, string> = {
  m3: "3 months",
  m6: "6 months",
  m12: "12 months",
};

/** Same texts as the backend defaults (backend-spec section 2). */
export const DEFAULT_TEMPLATES: ReminderTemplates = {
  d7: "Hi {firstName}, your TV subscription expires on {date} (7 days left). Please renew to keep your service running. Thank you!",
  d3: "Hi {firstName}, your TV subscription expires on {date} (3 days left). Please renew to keep your service running. Thank you!",
  d1: "Hi {firstName}, your TV subscription expires on {date} (1 day left). Please renew to keep your service running. Thank you!",
  expired:
    "Hi {firstName}, your TV subscription expired on {date}. Please renew to get your service back. Thank you!",
};

/** 0 -> "12:00 AM", 9 -> "9:00 AM", 12 -> "12:00 PM", 21 -> "9:00 PM". */
export function formatHour(hour: number): string {
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${hour12}:00 ${hour < 12 ? "AM" : "PM"}`;
}

export const HOUR_OPTIONS: { value: string; label: string }[] = Array.from(
  { length: 24 },
  (_, hour) => ({ value: String(hour), label: formatHour(hour) }),
);

/** Fills {firstName} and {date}. Function replacers keep "$" in names safe. */
export function renderTemplate(template: string, firstName: string, date: string): string {
  return template.replace(/\{firstName\}/g, () => firstName).replace(/\{date\}/g, () => date);
}

/* ------------------------------ form <-> API ------------------------------ */

function priceToText(price: number | null): string {
  return price === null ? "" : String(price);
}

export function settingsToFormValues(settings: Settings): SettingsFormValues {
  return {
    remind7Days: settings.remind7Days,
    remind3Days: settings.remind3Days,
    remind1Day: settings.remind1Day,
    remindExpired: settings.remindExpired,
    channels: {
      email: settings.reminderChannels.includes("email"),
      whatsapp: settings.reminderChannels.includes("whatsapp"),
    },
    sendHour: String(settings.reminderSendHour),
    templates: { ...settings.reminderTemplates },
    prices: {
      m3: priceToText(settings.prices.m3),
      m6: priceToText(settings.prices.m6),
      m12: priceToText(settings.prices.m12),
    },
  };
}

/** Saved values + the fields the user changed. */
export function applyEdits(
  base: SettingsFormValues,
  edits: Partial<SettingsFormValues>,
): SettingsFormValues {
  return {
    remind7Days: edits.remind7Days ?? base.remind7Days,
    remind3Days: edits.remind3Days ?? base.remind3Days,
    remind1Day: edits.remind1Day ?? base.remind1Day,
    remindExpired: edits.remindExpired ?? base.remindExpired,
    channels: edits.channels ?? base.channels,
    sendHour: edits.sendHour ?? base.sendHour,
    templates: edits.templates ?? base.templates,
    prices: edits.prices ?? base.prices,
  };
}

/** "" -> null (no price). Valid number -> number. Invalid text -> undefined. */
function parsePrice(text: string): number | null | undefined {
  if (text.trim() === "") return null;
  const amount = parseAmount(text);
  return amount === null ? undefined : amount;
}

/* ------------------------------ validation ------------------------------ */

/** Mirrors the backend: 1-500 characters, only {firstName} and {date} as placeholders. */
export function validateTemplateText(text: string): string | undefined {
  const trimmed = text.trim();
  if (trimmed === "") return "Enter the message";
  if (trimmed.length > TEMPLATE_MAX_LENGTH) {
    return `Message must be ${TEMPLATE_MAX_LENGTH} characters or less`;
  }
  const tokens = trimmed.match(/\{[^}]*\}/g) ?? [];
  const unknown = tokens.find((token) => !ALLOWED_PLACEHOLDERS.includes(token.slice(1, -1)));
  if (unknown) return `${unknown} is not allowed. Use {firstName} and {date}`;
  return undefined;
}

export function validatePriceText(text: string): string | undefined {
  return parsePrice(text) === undefined ? "Enter a valid price (up to 2 decimals)" : undefined;
}

export function validateSettingsForm(values: SettingsFormValues): SettingsFormErrors {
  const errors: SettingsFormErrors = {};

  const templates: Partial<Record<TemplateKey, string>> = {};
  for (const key of TEMPLATE_KEYS) {
    const message = validateTemplateText(values.templates[key]);
    if (message) templates[key] = message;
  }
  if (Object.keys(templates).length > 0) errors.templates = templates;

  const prices: Partial<Record<PriceKey, string>> = {};
  for (const key of PRICE_KEYS) {
    const message = validatePriceText(values.prices[key]);
    if (message) prices[key] = message;
  }
  if (Object.keys(prices).length > 0) errors.prices = prices;

  return errors;
}

export function hasSettingsErrors(errors: SettingsFormErrors): boolean {
  return (
    Object.keys(errors.templates ?? {}).length > 0 || Object.keys(errors.prices ?? {}).length > 0
  );
}

/* --------------------------------- diff --------------------------------- */

function enabledChannels(isOn: (channel: ReminderChannel) => boolean): ReminderChannel[] {
  return CHANNEL_ORDER.filter(isOn);
}

function sameList(a: readonly string[], b: readonly string[]): boolean {
  return a.length === b.length && a.every((item, index) => item === b[index]);
}

/**
 * Only the fields that differ from the saved settings.
 * Call after validation passed. Invalid price text is skipped here.
 */
export function buildSettingsPatch(
  saved: Settings,
  values: SettingsFormValues,
): UpdateSettingsInput {
  const patch: UpdateSettingsInput = {};

  for (const key of TOGGLE_KEYS) {
    if (values[key] !== saved[key]) patch[key] = values[key];
  }

  const channels = enabledChannels((channel) => values.channels[channel]);
  const savedChannels = enabledChannels((channel) => saved.reminderChannels.includes(channel));
  if (!sameList(channels, savedChannels)) patch.reminderChannels = channels;

  const hour = Number(values.sendHour);
  if (hour !== saved.reminderSendHour) patch.reminderSendHour = hour;

  const templates: Partial<ReminderTemplates> = {};
  for (const key of TEMPLATE_KEYS) {
    const next = values.templates[key].trim();
    if (next !== saved.reminderTemplates[key].trim()) templates[key] = next;
  }
  if (Object.keys(templates).length > 0) patch.reminderTemplates = templates;

  const prices: Partial<Record<PriceKey, number | null>> = {};
  for (const key of PRICE_KEYS) {
    const parsed = parsePrice(values.prices[key]);
    if (parsed !== undefined && parsed !== saved.prices[key]) prices[key] = parsed;
  }
  if (Object.keys(prices).length > 0) patch.prices = prices;

  return patch;
}

/** Is there anything to save? Invalid price text counts as a change (it differs from the saved number). */
export function isSettingsDirty(saved: Settings, values: SettingsFormValues): boolean {
  if (Object.keys(buildSettingsPatch(saved, values)).length > 0) return true;
  return PRICE_KEYS.some((key) => parsePrice(values.prices[key]) === undefined);
}