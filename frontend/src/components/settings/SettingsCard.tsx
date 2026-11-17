import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export const SETTINGS_CARD_CLASS = "rounded-2xl border border-neutral-200 bg-neutral-0 p-6";

export interface SettingsCardProps {
  title: string;
  description?: string;
  /** Small grey chip next to the title, for example "Optional". */
  badge?: string;
  children: ReactNode;
  className?: string;
}

export function SettingsCard({ title, description, badge, children, className }: SettingsCardProps) {
  return (
    <section className={cn(SETTINGS_CARD_CLASS, className)}>
      <div className="mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-[18px] font-semibold leading-[26px] text-neutral-900">{title}</h2>
          {badge && (
            <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-500">
              {badge}
            </span>
          )}
        </div>
        {description && <p className="text-sm leading-[22px] text-neutral-500">{description}</p>}
      </div>
      {children}
    </section>
  );
}