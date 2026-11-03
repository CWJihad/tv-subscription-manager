import { useId, type ComponentPropsWithRef } from "react";
import { cn } from "@/lib/cn";

export interface TextareaProps extends ComponentPropsWithRef<"textarea"> {
  label?: string;
  error?: string;
  hint?: string;
  wrapperClassName?: string;
}

export function Textarea({
  label, error, hint, wrapperClassName, className, id, rows = 4, ...rest
}: TextareaProps) {
  const autoId = useId();
  const textId = id ?? autoId;
  const helpId = `${textId}-help`;
  const help = error ?? hint;

  return (
    <div className={cn("flex flex-col gap-1.5", wrapperClassName)}>
      {label && (
        <label htmlFor={textId} className="text-[13px] font-medium leading-[18px] text-neutral-700">
          {label}
        </label>
      )}
      <textarea
        id={textId}
        rows={rows}
        aria-invalid={error ? true : undefined}
        aria-describedby={help ? helpId : undefined}
        className={cn(
          "w-full resize-y rounded-[10px] border bg-neutral-0 px-4 py-3 text-base leading-6 text-neutral-900 transition-colors",
          "placeholder:text-neutral-400 hover:border-neutral-400",
          "focus:outline-none focus:ring-2 focus:ring-primary-500/30",
          "disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:text-neutral-500 disabled:hover:border-neutral-200",
          error
            ? "border-danger-600 focus:border-danger-600 focus:ring-danger-600/20"
            : "border-neutral-200 focus:border-primary-500",
          className,
        )}
        {...rest}
      />
      {help && (
        <p id={helpId} className={cn("text-xs leading-[18px]", error ? "text-danger-700" : "text-neutral-500")}>
          {help}
        </p>
      )}
    </div>
  );
}