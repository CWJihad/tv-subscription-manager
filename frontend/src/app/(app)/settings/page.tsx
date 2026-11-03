"use client";

import { useState } from "react";
import { Lock, Mail, User } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { ChangePasswordModal } from "@/components/settings/ChangePasswordModal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Toggle } from "@/components/ui/Toggle";
import { useToast } from "@/hooks/useToast";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const card = "rounded-2xl border border-neutral-200 bg-neutral-0 p-6";

const REMINDER_OPTIONS = [
  { key: "7", label: "Remind me 7 days before expiry" },
  { key: "3", label: "Remind me 3 days before expiry" },
  { key: "1", label: "Remind me 1 day before expiry" },
] as const;

export default function SettingsPage() {
  const { show } = useToast();
  const [name, setName] = useState("Alex Owner");
  const [email, setEmail] = useState("owner@email.com");
  const [errors, setErrors] = useState<{ name?: string; email?: string }>({});
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [reminders, setReminders] = useState<Record<string, boolean>>({
    "7": true,
    "3": true,
    "1": true,
  });

  const save = () => {
    const found: { name?: string; email?: string } = {};
    if (!name.trim()) found.name = "Enter your name.";
    if (!EMAIL.test(email.trim())) found.email = "Enter a valid email address.";
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    show({ type: "success", title: "Changes saved" });
  };

  return (
    <>
      <PageHeader title="Settings" subtitle="Manage your account and password." />

      <div className="max-w-[700px] space-y-5">
        <section className={card}>
          <h2 className="mb-4 text-[18px] font-semibold leading-[26px] text-neutral-900">
            Account
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Name"
              leftIcon={User}
              value={name}
              onChange={(event) => setName(event.target.value)}
              error={errors.name}
            />
            <Input
              label="Email"
              type="email"
              leftIcon={Mail}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              error={errors.email}
            />
          </div>
          <div className="mt-5 flex justify-end">
            <Button variant="primary" onClick={save}>
              Save changes
            </Button>
          </div>
        </section>

        <section className={`${card} flex flex-wrap items-center justify-between gap-4`}>
          <div>
            <h2 className="text-[18px] font-semibold leading-[26px] text-neutral-900">Password</h2>
            <p className="text-sm leading-[22px] text-neutral-500">
              Use a strong password that only you know.
            </p>
          </div>
          <Button
            variant="outline"
            leftIcon={<Lock className="size-4" aria-hidden="true" />}
            onClick={() => setPasswordOpen(true)}
          >
            Change password
          </Button>
        </section>

        <section className={card}>
          <div className="flex items-center gap-2">
            <h2 className="text-[18px] font-semibold leading-[26px] text-neutral-900">
              Reminder settings
            </h2>
            <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-500">
              Optional
            </span>
          </div>
          <p className="mb-4 text-sm leading-[22px] text-neutral-500">
            Choose when a customer shows up as “Expiring soon”.
          </p>
          <div className="divide-y divide-neutral-200">
            {REMINDER_OPTIONS.map((option) => (
              <div key={option.key} className="py-3">
                <Toggle
                  label={option.label}
                  checked={reminders[option.key]}
                  onChange={(next) =>
                    setReminders((prev) => ({ ...prev, [option.key]: Boolean(next) }))
                  }
                />
              </div>
            ))}
          </div>
        </section>
      </div>

      <ChangePasswordModal open={passwordOpen} onClose={() => setPasswordOpen(false)} />
    </>
  );
}