import { useId, type SelectHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "children"> {
  label: string;
  options: readonly SelectOption[];
  /** Shown (disabled) while value is "". */
  placeholder?: string;
  error?: string | undefined;
  hint?: string;
  wrapperClassName?: string;
}

export function Select({
  label,
  options,
  placeholder,
  error,
  hint,
  wrapperClassName,
  className,
  id,
  ...rest
}: SelectProps) {
  const autoId = useId();
  const selectId = id ?? autoId;
  const helpId = `${selectId}-help`;
  const help = error ?? hint;

  return (
    <div className={cn("flex flex-col gap-1.5", wrapperClassName)}>
      <label
        htmlFor={selectId}
        className="text-[13px] font-medium leading-[18px] text-neutral-700"
      >
        {label}
      </label>
      <select
        id={selectId}
        aria-invalid={error ? true : undefined}
        aria-describedby={help ? helpId : undefined}
        className={cn(
          "select h-12 w-full rounded-[10px] border bg-neutral-0 pl-4 pr-10 text-base leading-6 text-neutral-900 transition-colors",
          "hover:border-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30",
          "disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:text-neutral-500 disabled:hover:border-neutral-200",
          error
            ? "border-danger-600 focus:border-danger-600 focus:ring-danger-600/20"
            : "border-neutral-200 focus:border-primary-500",
          className,
        )}
        {...rest}
      >
        {placeholder !== undefined && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {help && (
        <p
          id={helpId}
          className={cn("text-xs leading-[18px]", error ? "text-danger-700" : "text-neutral-500")}
        >
          {help}
        </p>
      )}
    </div>
  );
}