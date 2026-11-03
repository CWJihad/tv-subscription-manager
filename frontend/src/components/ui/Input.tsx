import { useId, type ComponentPropsWithRef } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

export interface InputProps extends Omit<ComponentPropsWithRef<"input">, "size"> {
  label?: string;
  leftIcon?: LucideIcon;
  error?: string;
  hint?: string;
  wrapperClassName?: string;
}

export function Input({
  label, leftIcon: LeftIcon, error, hint, wrapperClassName, className, id, disabled, ...rest
}: InputProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const helpId = `${inputId}-help`;
  const help = error ?? hint;

  return (
    <div className={cn("flex flex-col gap-1.5", wrapperClassName)}>
      {label && (
        <label htmlFor={inputId} className="text-[13px] font-medium leading-[18px] text-neutral-700">
          {label}
        </label>
      )}
      <div className="relative">
        {LeftIcon && (
          <LeftIcon
            aria-hidden="true"
            className="pointer-events-none absolute left-3.5 top-1/2 size-[18px] -translate-y-1/2 text-neutral-400"
          />
        )}
        <input
          id={inputId}
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          aria-describedby={help ? helpId : undefined}
          className={cn(
            "h-12 w-full rounded-[10px] border bg-neutral-0 pr-4 text-base leading-6 text-neutral-900 transition-colors",
            "placeholder:text-neutral-400 hover:border-neutral-400",
            "focus:outline-none focus:ring-2 focus:ring-primary-500/30",
            "disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:text-neutral-500 disabled:hover:border-neutral-200",
            LeftIcon ? "pl-11" : "pl-4",
            error
              ? "border-danger-600 focus:border-danger-600 focus:ring-danger-600/20"
              : "border-neutral-200 focus:border-primary-500",
            className,
          )}
          {...rest}
        />
      </div>
      {help && (
        <p id={helpId} className={cn("text-xs leading-[18px]", error ? "text-danger-700" : "text-neutral-500")}>
          {help}
        </p>
      )}
    </div>
  );
}