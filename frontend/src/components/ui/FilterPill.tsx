import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/cn";

export interface FilterPillProps extends Omit<ComponentPropsWithoutRef<"button">, "children"> {
  label: string;
  count?: number;
  selected: boolean;
}

export function FilterPill({ label, count, selected, className, type = "button", ...rest }: FilterPillProps) {
  return (
    <button
      type={type}
      aria-pressed={selected}
      className={cn(
        "inline-flex h-11 shrink-0 items-center gap-2 whitespace-nowrap rounded-full border px-4 text-sm font-medium leading-[22px] transition-colors md:h-10",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2",
        "disabled:cursor-not-allowed disabled:opacity-50",
        selected
          ? "border-primary-600 bg-primary-600 text-white"
          : "border-neutral-200 bg-neutral-0 text-neutral-700 hover:bg-neutral-100",
        className,
      )}
      {...rest}
    >
      {label}
      {count !== undefined && (
        <span className={cn("text-xs font-semibold", selected ? "text-white/80" : "text-neutral-500")}>{count}</span>
      )}
    </button>
  );
}