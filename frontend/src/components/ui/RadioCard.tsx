import { cn } from "@/lib/cn";

export interface RadioCardProps {
  name: string;
  value: string;
  checked: boolean;
  onChange: (value: string) => void;
  title: string;
  description?: string;
  disabled?: boolean;
  className?: string;
}

export function RadioCard({ name, value, checked, onChange, title, description, disabled, className }: RadioCardProps) {
  return (
    <label
      className={cn(
        "flex min-h-14 flex-col justify-center rounded-xl border bg-neutral-0 px-4 py-3 transition-colors",
        "has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary-500 has-[:focus-visible]:ring-offset-2",
        checked ? "border-primary-600 bg-primary-50" : "border-neutral-200 hover:border-neutral-400 hover:bg-neutral-25",
        disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
        className,
      )}
    >
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        disabled={disabled}
        onChange={() => onChange(value)}
        className="sr-only"
      />
      <span className={cn("text-sm font-semibold leading-5", checked ? "text-primary-700" : "text-neutral-900")}>
        {title}
      </span>
      {description && <span className="text-xs leading-[18px] text-neutral-500">{description}</span>}
    </label>
  );
}