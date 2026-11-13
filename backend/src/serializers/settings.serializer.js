const toSettingsDto = (settings) => ({
  remind7Days: settings.remind7Days,
  remind3Days: settings.remind3Days,
  remind1Day: settings.remind1Day,
  remindExpired: settings.remindExpired,
  reminderChannels: [...settings.reminderChannels],
  reminderSendHour: settings.reminderSendHour,
  reminderTemplates: {
    d7: settings.reminderTemplates.d7,
    d3: settings.reminderTemplates.d3,
    d1: settings.reminderTemplates.d1,
    expired: settings.reminderTemplates.expired,
  },
  prices: {
    m3: settings.prices.m3 ?? null,
    m6: settings.prices.m6 ?? null,
    m12: settings.prices.m12 ?? null,
  },
});

module.exports = {
  toSettingsDto,
};