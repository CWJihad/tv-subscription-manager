"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button, type ButtonSize, type ButtonVariant } from "@/components/ui/Button";
import { copyToClipboard } from "@/lib/clipboard";

export interface CopyButtonProps {
  value: string;
  label?: string;
  copiedLabel?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  onCopied?: () => void;
  onError?: () => void;
  className?: string;
}

export function CopyButton({
  value, label, copiedLabel = "Copied", variant = "ghost", size = "sm", disabled, onCopied, onError, className,
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(() => () => {
    if (timer.current !== null) window.clearTimeout(timer.current);
  }, []);

  const handleCopy = async () => {
    const ok = await copyToClipboard(value);
    if (!ok) {
      onError?.();
      return;
    }
    setCopied(true);
    onCopied?.();
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(false), 1500);
  };

  const Icon = copied ? Check : Copy;
  const icon = <Icon className="size-4" aria-hidden="true" />;

  return (
    <>
      <Button
        variant={variant}
        size={size}
        disabled={disabled}
        onClick={handleCopy}
        className={className}
        iconOnly={!label}
        aria-label={label ? undefined : "Copy"}
        leftIcon={label ? icon : undefined}
      >
        {label ? (copied ? copiedLabel : label) : icon}
      </Button>
      <span className="sr-only" role="status">{copied ? copiedLabel : ""}</span>
    </>
  );
}