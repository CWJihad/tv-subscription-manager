import { SettingsCard } from "@/components/settings/SettingsCard";
import { Input } from "@/components/ui/Input";
import { DEFAULT_CURRENCY } from "@/lib/payment";
import { PRICE_KEYS, PRICE_LABELS } from "@/lib/settings";
import type { PriceKey, SettingsFormErrors, SettingsFormValues } from "@/types";

export interface PricesCardProps {
  values: SettingsFormValues;
  errors: SettingsFormErrors;
  disabled?: boolean;
  onChange: (key: PriceKey, text: string) => void;
}

export function PricesCard({ values, errors, disabled, onChange }: PricesCardProps) {
  return (
    <SettingsCard
      title="Default prices"
      description="Prefill the amount when you record a payment. Leave a price empty for no prefill."
    >
      <div className="grid gap-4 sm:grid-cols-3">
        {PRICE_KEYS.map((key) => (
          <Input
            key={key}
            label={`${PRICE_LABELS[key]} (${DEFAULT_CURRENCY})`}
            inputMode="decimal"
            placeholder="e.g. 1500"
            value={values.prices[key]}
            disabled={disabled === true}
            error={errors.prices?.[key]}
            onChange={(event) => onChange(key, event.target.value)}
          />
        ))}
      </div>
    </SettingsCard>
  );
}