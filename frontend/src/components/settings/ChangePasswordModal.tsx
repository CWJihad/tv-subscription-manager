"use client";

import { useRef, useState } from "react";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { useToast } from "@/hooks/useToast";
import { ApiError, changePassword } from "@/lib/api";
import { PASSWORD_HINT, hasPasswordErrors, validateChangePassword } from "@/lib/password";
import type { ChangePasswordFormErrors } from "@/types";

const GENERIC_ERROR = "Could not update your password. Please try again.";

export interface ChangePasswordModalProps {
  open: boolean;
  onClose: () => void;
}

export function ChangePasswordModal({ open, onClose }: ChangePasswordModalProps) {
  if (!open) return null;
  return <ChangePasswordContent onClose={onClose} />;
}

function ChangePasswordContent({ onClose }: { onClose: () => void }) {
  const { show } = useToast();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<ChangePasswordFormErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const submittingRef = useRef(false);

  function clear(field: keyof ChangePasswordFormErrors) {
    setErrors((previous) => ({ ...previous, [field]: undefined }));
    setFormError(null);
  }

  async function submit() {
    if (submittingRef.current) return;

    const result = validateChangePassword({ current, next, confirm });
    setErrors(result);
    setFormError(null);
    if (hasPasswordErrors(result)) return;

    submittingRef.current = true;
    setLoading(true);
    try {
      await changePassword({ oldPassword: current, newPassword: next });
      show({ type: "success", title: "Password updated" });
      onClose(); // the modal unmounts, so the fields are cleared
    } catch (error) {
      if (error instanceof ApiError) {
        if (/incorrect password/i.test(error.message)) {
          setErrors({ current: error.message });
        } else if (/same as old/i.test(error.message)) {
          setErrors({ next: error.message });
        } else {
          setFormError(error.message);
        }
      } else {
        setFormError(GENERIC_ERROR);
      }
    } finally {
      submittingRef.current = false;
      setLoading(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Change password"
      subtitle={PASSWORD_HINT}
      icon={Lock}
      iconTone="primary"
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="primary" onClick={submit} loading={loading}>
            Update password
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {formError && (
          <div
            role="alert"
            className="rounded-[10px] border border-danger-600 bg-danger-50 px-4 py-3 text-sm leading-[22px] text-danger-700"
          >
            {formError}
          </div>
        )}
        <PasswordInput
          label="Current password"
          leftIcon={Lock}
          value={current}
          disabled={loading}
          onChange={(event) => {
            setCurrent(event.target.value);
            clear("current");
          }}
          error={errors.current}
          autoComplete="current-password"
        />
        <PasswordInput
          label="New password"
          leftIcon={Lock}
          value={next}
          disabled={loading}
          onChange={(event) => {
            setNext(event.target.value);
            clear("next");
          }}
          error={errors.next}
          autoComplete="new-password"
        />
        <PasswordInput
          label="Confirm new password"
          leftIcon={Lock}
          value={confirm}
          disabled={loading}
          onChange={(event) => {
            setConfirm(event.target.value);
            clear("confirm");
          }}
          error={errors.confirm}
          autoComplete="new-password"
        />
      </div>
    </Modal>
  );
}