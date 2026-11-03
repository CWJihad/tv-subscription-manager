import { toneClasses } from "@/lib/tones";
import { cn } from "@/lib/cn";

export interface ProgressBarProps {
  value: number;
  tone?: "primary" | "success" | "warning" | "danger";
  startLabel?: string;
  endLabel?: string;
  label?: string;
  className?: string;
}

export function ProgressBar({ value, tone = "primary", startLabel, endLabel, label = "Subscription progress", className }: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, Math.round(value)));
  return (
    <div className={className}>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        className="h-2 w-full overflow-hidden rounded-full bg-neutral-200"
      >
        <div className={cn("h-full rounded-full transition-[width]", toneClasses[tone].fill)} style={{ width: `${pct}%` }} />
      </div>
      {(startLabel || endLabel) && (
        <div className="mt-2 flex justify-between text-xs leading-[18px] text-neutral-500">
          <span>{startLabel}</span>
          <span>{endLabel}</span>
        </div>
      )}
    </div>
  );
}