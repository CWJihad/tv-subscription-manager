import { useId } from "react";
import { SettingsCard } from "@/components/settings/SettingsCard";
import { Checkbox } from "@/components/ui/Checkbox";
import { Select } from "@/components/ui/Select";
import { Toggle } from "@/components/ui/Toggle";
import { CHANNEL_LABELS, CHANNEL_ORDER, HOUR_OPTIONS } from "@/lib/settings";
import type { ReminderChannel, SettingsFormValues, ToggleKey } from "@/types";

const TOGGLES: { key: ToggleKey; label: string; description?: string }[] = [
  { key: "remind7Days", label: "Remind me 7 days before expiry" },
  { key: "remind3Days", label: "Remind me 3 days before expiry" },
  { key: "remind1Day", label: "Remind me 1 day before expiry" },
  {
    key: "remindExpired",
    label: "Remind me after expiry",
    description: "Sent the day after the expiry date.",
  },
];

export interface ReminderSettingsCardProps {
  values: SettingsFormValues;
  /** Time zone name from GET /meta, if known. */
  timezone: string | null;
  disabled?: boolean;
  onToggle: (key: ToggleKey, value: boolean) => void;
  onChannelChange: (channel: ReminderChannel, checked: boolean) => void;
  onSendHourChange: (hour: string) => void;
}

export function ReminderSettingsCard({
  values,
  timezone,
  disabled,
  onToggle,
  onChannelChange,
  onSendHourChange,
}: ReminderSettingsCardProps) {
  const channelsId = useId();
  const noChannel = CHANNEL_ORDER.every((channel) => !values.channels[channel]);

  return (
    <SettingsCard
      title="Reminder settings"
      badge="Optional"
      description="Choose which automatic reminders are sent."
    >
      <div className="divide-y divide-neutral-200">
        {TOGGLES.map((option) => (
          <div key={option.key} className="py-3">
            <Toggle
              label={option.label}
              {...(option.description ? { description: option.description } : {})}
              checked={values[option.key]}
              disabled={disabled === true}
              onChange={(next) => onToggle(option.key, next)}
            />
          </div>
        ))}
      </div>

      <div role="group" aria-labelledby={channelsId} className="mt-2 border-t border-neutral-200 pt-4">
        <p id={channelsId} className="mb-1 text-[13px] font-medium leading-[18px] text-neutral-700">
          Send reminders by
        </p>
        {CHANNEL_ORDER.map((channel) => (
          <Checkbox
            key={channel}
            label={CHANNEL_LABELS[channel]}
            {...(channel === "email"
              ? { description: "Customers without an email are skipped." }
              : {})}
            checked={values.channels[channel]}
            disabled={disabled === true}
            onChange={(checked) => onChannelChange(channel, checked)}
          />
        ))}
        {noChannel && (
          <p role="status" className="mt-1 text-xs leading-[18px] text-warning-700">
            No channel selected. No reminders will be sent.
          </p>
        )}
      </div>

      <div className="mt-4 border-t border-neutral-200 pt-4 sm:max-w-[260px]">
        <Select
          label="Send at"
          options={HOUR_OPTIONS}
          value={values.sendHour}
          disabled={disabled === true}
          hint={timezone ? `Time zone: ${timezone}` : "Uses the business time zone."}
          onChange={(event) => onSendHourChange(event.target.value)}
        />
      </div>
    </SettingsCard>
  );
}