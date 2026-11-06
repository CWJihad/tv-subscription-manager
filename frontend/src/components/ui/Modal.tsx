"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { X, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  iconTone?: "primary" | "danger";
  children?: ReactNode;
  footer?: ReactNode;
  size?: "md" | "lg";
}

export function Modal({ open, onClose, title, subtitle, icon: Icon, iconTone = "primary", children, footer, size = "md" }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={() => {
        if (open) onClose();
      }}
      className="modal bg-neutral-900/50"
    >
      {open && (
        <>
          <div
            className={cn(
              "modal-box relative w-[calc(100%-2rem)] rounded-3xl bg-neutral-0 p-6 shadow-xl sm:p-8",
              size === "md" ? "max-w-[500px]" : "max-w-[600px]",
            )}
          >
            <div className="flex justify-between">
            <div className="flex gap-3">
            {Icon && (
              <span
                className={cn(
                  "mb-4 inline-flex size-12 items-center justify-center rounded-full",
                  iconTone === "danger" ? "bg-danger-50 text-danger-600" : "bg-primary-50 text-primary-600",
                )}
              >
                <Icon className="size-6" aria-hidden="true" />
              </span>
            )}
            <span>
            <h2 id={titleId} className="text-lg font-semibold leading-[26px] text-neutral-900">
              {title}
            </h2>
            {subtitle && <p className="mt-0.5 text-xs leading-[18px] text-neutral-500">{subtitle}</p>}
            </span>
            </div>
            <Button variant="ghost" size="sm" iconOnly aria-label="Close" onClick={onClose}>
              <X className="size-5" aria-hidden="true" />
            </Button>
            </div>
            {children && <div className="mt-6">{children}</div>}
            {footer && <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">{footer}</div>}
          </div>
          <form method="dialog" className="modal-backdrop">
            <button type="submit" tabIndex={-1} aria-label="Close">close</button>
          </form>
        </>
      )}
    </dialog>
  );
}