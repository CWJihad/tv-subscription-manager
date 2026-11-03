import type { LucideIcon } from "lucide-react";
import { Mail, Phone } from "lucide-react";
import { CopyButton } from "@/components/ui/CopyButton";

export interface ContactCardProps {
  phone: string;
  email: string;
}

function Row({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
        <Icon className="size-4" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-xs leading-[18px] text-neutral-500">{label}</p>
        <p className="truncate text-sm font-medium leading-[22px] text-neutral-900">
          {value || "—"}
        </p>
      </div>
      {value && <CopyButton value={value} variant="outline" size="sm" />}
    </div>
  );
}

export function ContactCard({ phone, email }: ContactCardProps) {
  return (
    <section className="rounded-2xl border border-neutral-200 bg-neutral-0 p-6">
      <h2 className="mb-4 text-[18px] font-semibold leading-[26px] text-neutral-900">Contact</h2>
      <div className="space-y-4">
        <Row icon={Phone} label="Phone" value={phone} />
        <Row icon={Mail} label="Email" value={email} />
      </div>
    </section>
  );
}