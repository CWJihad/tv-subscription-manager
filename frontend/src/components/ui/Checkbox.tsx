import { useId } from "react";
import { cn } from "@/lib/cn";

export interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
  disabled?: boolean;
  id?: string;
  className?: string;
}

export function Checkbox({
  checked,
  onChange,
  label,
  description,
  disabled,
  id,
  className,
}: CheckboxProps) {
  const autoId = useId();
  const checkboxId = id ?? autoId;
  return (
    <label
      htmlFor={checkboxId}
      className={cn(
        "flex items-start gap-3 py-2",
        disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
        className,
      )}
    >
      <input
        id={checkboxId}
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
        className="checkbox checkbox-primary mt-0.5 size-5 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
      />
      <span className="min-w-0">
        <span className="block text-sm font-medium leading-[22px] text-neutral-900">{label}</span>
        {description && (
          <span className="block text-xs leading-[18px] text-neutral-500">{description}</span>
        )}
      </span>
    </label>
  );
}