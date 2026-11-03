export type Tone = "neutral" | "primary" | "success" | "warning" | "danger";
export type StatusTone = "success" | "warning" | "danger";

export interface ToneClasses {
  soft: string;       // tinted background
  strong: string;     // icon / number colour
  badgeText: string;  // text on tinted background
  dot: string;
  fill: string;       // solid fill (progress bar)
  border: string;     // solid border (toast)
  softBorder: string; // subtle border (banner)
}

export const toneClasses: Record<Tone, ToneClasses> = {
  neutral: {
    soft: "bg-neutral-100", strong: "text-neutral-900", badgeText: "text-neutral-700",
    dot: "bg-neutral-500", fill: "bg-neutral-500", border: "border-neutral-200", softBorder: "border-neutral-200",
  },
  primary: {
    soft: "bg-primary-50", strong: "text-primary-600", badgeText: "text-primary-700",
    dot: "bg-primary-600", fill: "bg-primary-600", border: "border-primary-600", softBorder: "border-primary-600/30",
  },
  success: {
    soft: "bg-success-50", strong: "text-success-600", badgeText: "text-success-700",
    dot: "bg-success-600", fill: "bg-success-600", border: "border-success-600", softBorder: "border-success-600/30",
  },
  warning: {
    soft: "bg-warning-50", strong: "text-warning-600", badgeText: "text-warning-700",
    dot: "bg-warning-600", fill: "bg-warning-600", border: "border-warning-600", softBorder: "border-warning-600/30",
  },
  danger: {
    soft: "bg-danger-50", strong: "text-danger-600", badgeText: "text-danger-700",
    dot: "bg-danger-600", fill: "bg-danger-600", border: "border-danger-600", softBorder: "border-danger-600/30",
  },
};