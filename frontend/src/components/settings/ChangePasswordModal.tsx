"use client";

import { useState } from "react";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { useToast } from "@/hooks/useToast";

export interface ChangePasswordModalProps {
  open: boolean;
  onClose: () => void;
}

export function ChangePasswordModal({ open, onClose }: ChangePasswordModalProps) {
  if (!open) return null;
  return <ChangePasswordContent onClose={onClose} />;
}

interface Errors {
  current?: string;
  next?: string;
  confirm?: string;
}

function ChangePasswordContent({ onClose }: { onClose: () => void }) {
  const { show } = useToast();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<Errors>({});

  const submit = () => {
    const result: Errors = {};
    if (!current) result.current = "Enter your current password.";
    if (next.length < 8) result.next = "Use at least 8 characters.";
    if (confirm !== next) result.confirm = "Passwords do not match.";
    setErrors(result);
    if (Object.keys(result).length > 0) return;
    // Mock only: the backend will verify the current password later.
    show({ type: "success", title: "Password updated" });
    onClose();
  };

  return (
    <Modal
      open
      onClose={onClose}
      title="Change password"
      subtitle="Use at least 8 characters"
      icon={Lock}
      iconTone="primary"
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={submit}>
            Update password
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <PasswordInput
          label="Current password"
          leftIcon={Lock}
          value={current}
          onChange={(event) => setCurrent(event.target.value)}
          error={errors.current}
          autoComplete="current-password"
        />
        <PasswordInput
          label="New password"
          leftIcon={Lock}
          value={next}
          onChange={(event) => setNext(event.target.value)}
          error={errors.next}
          autoComplete="new-password"
        />
        <PasswordInput
          label="Confirm new password"
          leftIcon={Lock}
          value={confirm}
          onChange={(event) => setConfirm(event.target.value)}
          error={errors.confirm}
          autoComplete="new-password"
        />
      </div>
    </Modal>
  );
}