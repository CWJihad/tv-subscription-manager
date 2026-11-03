import { cn } from "@/lib/cn";

export type LoginStatTone = "success" | "warning" | "danger";

interface LoginStatChipProps {
  value: number;
  label: string;
  tone: LoginStatTone;
}

const numberToneClasses: Record<LoginStatTone, string> = {
  success: "text-success-600",
  warning: "text-warning-600",
  danger: "text-danger-600",
};

export function LoginStatChip({ value, label, tone }: LoginStatChipProps) {
  return (
    <div className="flex w-full max-w-xs items-center gap-3 rounded-2xl bg-neutral-0 px-5 py-3.5 shadow-sm">
      <span className={cn("text-[28px] font-bold leading-9", numberToneClasses[tone])}>{value}</span>
      <span className="text-sm font-medium leading-[22px] text-neutral-700">{label}</span>
    </div>
  );
}