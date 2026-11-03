import { useId } from "react";
import { cn } from "@/lib/cn";

export interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
  disabled?: boolean;
  id?: string;
  className?: string;
}

export function Toggle({ checked, onChange, label, description, disabled, id, className }: ToggleProps) {
  const autoId = useId();
  const toggleId = id ?? autoId;
  return (
    <label
      htmlFor={toggleId}
      className={cn(
        "flex items-center justify-between gap-4 py-3",
        disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
        className,
      )}
    >
      <span className="min-w-0">
        <span className="block text-sm font-medium leading-[22px] text-neutral-900">{label}</span>
        {description && <span className="block text-xs leading-[18px] text-neutral-500">{description}</span>}
      </span>
      <input
        id={toggleId}
        type="checkbox"
        role="switch"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="toggle toggle-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
      />
    </label>
  );
}