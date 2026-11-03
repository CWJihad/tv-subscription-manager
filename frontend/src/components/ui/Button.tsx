import { Loader2 } from "lucide-react";
import type { ComponentPropsWithRef, ReactNode } from "react";
import { cn } from "@/lib/cn";

export type ButtonVariant = "primary" | "soft" | "outline" | "danger" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonStyleOptions {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  iconOnly?: boolean;
  className?: string;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-primary-600 border-primary-600 text-white hover:bg-primary-700 hover:border-primary-700 active:bg-primary-700",
  soft: "bg-primary-50 border-primary-50 text-primary-700 hover:bg-primary-100 hover:border-primary-100",
  outline: "bg-neutral-0 border-neutral-200 text-neutral-700 hover:bg-neutral-25 hover:border-neutral-400",
  danger: "bg-danger-600 border-danger-600 text-white hover:bg-danger-700 hover:border-danger-700",
  ghost: "bg-transparent border-transparent text-neutral-700 hover:bg-neutral-100",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-9 px-3",
  md: "h-11 px-4 md:h-10",
  lg: "h-11 px-5",
};

const iconOnlySizeClasses: Record<ButtonSize, string> = {
  sm: "h-9 w-9 px-0",
  md: "h-11 w-11 px-0 md:h-10 md:w-10",
  lg: "h-11 w-11 px-0",
};

export function buttonClasses({
  variant = "primary",
  size = "md",
  fullWidth = false,
  iconOnly = false,
  className,
}: ButtonStyleOptions): string {
  return cn(
    "btn relative gap-2 rounded-[10px] border text-sm font-semibold leading-5 whitespace-nowrap shadow-none transition-colors",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2",
    "disabled:cursor-not-allowed disabled:opacity-50",
    variantClasses[variant],
    iconOnly ? iconOnlySizeClasses[size] : sizeClasses[size],
    fullWidth && "w-full",
    className,
  );
}

export interface ButtonProps extends ComponentPropsWithRef<"button">, ButtonStyleOptions {
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export function Button({
  variant, size, fullWidth, iconOnly, className,
  loading = false, leftIcon, rightIcon, disabled, type = "button", children, ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={buttonClasses({ variant, size, fullWidth, iconOnly, className })}
      {...rest}
    >
      <span className={cn("inline-flex items-center justify-center gap-2", loading && "invisible")}>
        {leftIcon}
        {children}
        {rightIcon}
      </span>
      {loading && (
        <span className="absolute inset-0 flex items-center justify-center">
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          <span className="sr-only">Loading</span>
        </span>
      )}
    </button>
  );
}

