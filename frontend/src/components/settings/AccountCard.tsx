"use client";

import { useRef, useState } from "react";
import { Mail, User } from "lucide-react";
import { SettingsCard } from "@/components/settings/SettingsCard";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/hooks/useToast";
import { ApiError, updateSelf } from "@/lib/api";
import { setSelf, useSelf } from "@/lib/owner";
import type { UpdateSelfInput } from "@/types";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const GENERIC_ERROR = "Something went wrong. Please try again.";

interface AccountErrors {
  name?: string | undefined;
  email?: string | undefined;
}

export function AccountCard() {
  const { show } = useToast();
  const { self, loading, failed, retry } = useSelf();
  const [draft, setDraft] = useState<{ fullName?: string; email?: string }>({});
  const [errors, setErrors] = useState<AccountErrors>({});
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);

  // Shown values = what the user typed, otherwise the saved account.
  const fullName = draft.fullName ?? self?.fullName ?? "";
  const email = draft.email ?? self?.email ?? "";
  const dirty =
    self !== null &&
    (fullName.trim() !== self.fullName || email.trim().toLowerCase() !== self.email.toLowerCase());

  async function save() {
    if (!self || savingRef.current) return;

    const found: AccountErrors = {};
    if (!fullName.trim()) found.name = "Enter your name.";
    if (!EMAIL.test(email.trim())) found.email = "Enter a valid email address.";
    setErrors(found);
    if (found.name || found.email) return;

    const patch: UpdateSelfInput = {};
    if (fullName.trim() !== self.fullName) patch.fullName = fullName.trim();
    if (email.trim().toLowerCase() !== self.email.toLowerCase()) patch.email = email.trim();
    if (!patch.fullName && !patch.email) return;

    savingRef.current = true;
    setSaving(true);
    try {
      const updated = await updateSelf(patch);
      setSelf(updated); // sidebar and header update right away
      setDraft({});
      setErrors({});
      show({ type: "success", title: "Changes saved" });
    } catch (error) {
      if (error instanceof ApiError) {
        // For example 400 "Email already taken".
        const emailMessage = error.fieldErrors?.email ?? (/email/i.test(error.message) ? error.message : undefined);
        const nameMessage = error.fieldErrors?.fullName;
        if (emailMessage || nameMessage) {
          setErrors({ name: nameMessage, email: emailMessage });
        } else {
          show({ type: "error", title: "Could not save changes", message: error.message });
        }
      } else {
        show({ type: "error", title: "Could not save changes", message: GENERIC_ERROR });
      }
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }

  return (
    <SettingsCard title="Account">
      {failed && (
        <div
          role="alert"
          className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-[10px] border border-danger-600 bg-danger-50 px-4 py-3 text-sm leading-[22px] text-danger-700"
        >
          <span>Could not load your account.</span>
          <Button variant="outline" onClick={retry}>
            Try again
          </Button>
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Name"
          leftIcon={User}
          value={fullName}
          disabled={loading || saving || !self}
          onChange={(event) => {
            setDraft((previous) => ({ ...previous, fullName: event.target.value }));
            setErrors((previous) => ({ ...previous, name: undefined }));
          }}
          error={errors.name}
        />
        <Input
          label="Email"
          type="email"
          leftIcon={Mail}
          value={email}
          disabled={loading || saving || !self}
          onChange={(event) => {
            setDraft((previous) => ({ ...previous, email: event.target.value }));
            setErrors((previous) => ({ ...previous, email: undefined }));
          }}
          error={errors.email}
        />
      </div>
      <div className="mt-5 flex justify-end">
        <Button variant="primary" onClick={save} loading={saving} disabled={!dirty}>
          Save changes
        </Button>
      </div>
    </SettingsCard>
  );
}