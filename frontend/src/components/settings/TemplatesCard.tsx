import { SettingsCard } from "@/components/settings/SettingsCard";
import { Textarea } from "@/components/ui/Textarea";
import { DEFAULT_TEMPLATES, TEMPLATE_KEYS, TEMPLATE_LABELS } from "@/lib/settings";
import type { SettingsFormErrors, SettingsFormValues, TemplateKey } from "@/types";

export interface TemplatesCardProps {
  values: SettingsFormValues;
  errors: SettingsFormErrors;
  disabled?: boolean;
  onChange: (key: TemplateKey, text: string) => void;
}

export function TemplatesCard({ values, errors, disabled, onChange }: TemplatesCardProps) {
  return (
    <SettingsCard
      title="Message templates"
      description="Used for the Send reminder messages. Use {firstName} and {date} in the text."
    >
      <div className="space-y-5">
        {TEMPLATE_KEYS.map((key) => {
          const text = values.templates[key];
          const isDefault = text.trim() === DEFAULT_TEMPLATES[key];
          return (
            <div key={key}>
              <Textarea
                label={TEMPLATE_LABELS[key]}
                rows={3}
                value={text}
                disabled={disabled === true}
                error={errors.templates?.[key]}
                onChange={(event) => onChange(key, event.target.value)}
              />
              {!isDefault && !disabled && (
                <button
                  type="button"
                  onClick={() => onChange(key, DEFAULT_TEMPLATES[key])}
                  className="mt-1.5 rounded text-sm font-medium leading-5 text-primary-600 transition-colors hover:text-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
                >
                  Reset to default
                </button>
              )}
            </div>
          );
        })}
      </div>
    </SettingsCard>
  );
}