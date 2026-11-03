import Link from "next/link";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { buttonClasses, type ButtonStyleOptions } from "@/components/ui/Button";

export interface ButtonLinkProps
  extends Omit<ComponentPropsWithoutRef<typeof Link>, "className">,
    ButtonStyleOptions {
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export function ButtonLink({
  variant, size, fullWidth, iconOnly, className, leftIcon, rightIcon, children, ...rest
}: ButtonLinkProps) {
  return (
    <Link className={buttonClasses({ variant, size, fullWidth, iconOnly, className })} {...rest}>
      {leftIcon}
      {children}
      {rightIcon}
    </Link>
  );
}