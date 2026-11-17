export interface PriceSettings {
  m3: number | null;
  m6: number | null;
  m12: number | null;
}

export type ReminderChannel = "email" | "whatsapp";

export interface ReminderTemplates {
  d7: string;
  d3: string;
  d1: string;
  expired: string;
}

export type TemplateKey = keyof ReminderTemplates;
export type PriceKey = keyof PriceSettings;
export type ToggleKey = "remind7Days" | "remind3Days" | "remind1Day" | "remindExpired";

/** GET /settings */
export interface Settings {
  remind7Days: boolean;
  remind3Days: boolean;
  remind1Day: boolean;
  remindExpired: boolean;
  reminderChannels: ReminderChannel[];
  reminderSendHour: number; // 0-23
  reminderTemplates: ReminderTemplates;
  prices: PriceSettings;
}

/** PATCH /settings body. Only changed fields are sent. */
export interface UpdateSettingsInput {
  remind7Days?: boolean;
  remind3Days?: boolean;
  remind1Day?: boolean;
  remindExpired?: boolean;
  reminderChannels?: ReminderChannel[];
  reminderSendHour?: number;
  reminderTemplates?: Partial<ReminderTemplates>;
  prices?: Partial<PriceSettings>;
}

/** What the Settings form edits. Everything the user types is a string. */
export interface SettingsFormValues {
  remind7Days: boolean;
  remind3Days: boolean;
  remind1Day: boolean;
  remindExpired: boolean;
  channels: Record<ReminderChannel, boolean>;
  sendHour: string; // "0".."23"
  templates: ReminderTemplates;
  prices: Record<PriceKey, string>; // "" = no price
}

export interface SettingsFormErrors {
  templates?: Partial<Record<TemplateKey, string>>;
  prices?: Partial<Record<PriceKey, string>>;
}