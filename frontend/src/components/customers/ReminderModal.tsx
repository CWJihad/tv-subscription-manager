"use client";

import { useState } from "react";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { CopyButton } from "@/components/ui/CopyButton";
import { FilterPill } from "@/components/ui/FilterPill";
import { Modal } from "@/components/ui/Modal";
import { Textarea } from "@/components/ui/Textarea";
import { useToast } from "@/hooks/useToast";
import {
  REMINDER_TEMPLATES,
  getDefaultTemplate,
  getReminderMessage,
  type ReminderTemplate,
} from "@/lib/reminders";
import type { CustomerWithStatus } from "@/types";

export interface ReminderModalProps {
  customer: CustomerWithStatus | null;
  onClose: () => void;
}

export function ReminderModal({ customer, onClose }: ReminderModalProps) {
  if (!customer) return null;
  return <ReminderModalContent key={customer.id} customer={customer} onClose={onClose} />;
}

function ReminderModalContent({
  customer,
  onClose,
}: {
  customer: CustomerWithStatus;
  onClose: () => void;
}) {
  const { show } = useToast();
  const [template, setTemplate] = useState<ReminderTemplate>(() =>
    getDefaultTemplate(customer.daysLeft),
  );
  const [message, setMessage] = useState(() =>
    getReminderMessage(customer, getDefaultTemplate(customer.daysLeft)),
  );

  const pick = (value: ReminderTemplate) => {
    setTemplate(value);
    setMessage(getReminderMessage(customer, value));
  };

  return (
    <Modal
      open
      onClose={onClose}
      title="Send reminder"
      subtitle={`${customer.fullName} · ${customer.phone}`}
      icon={MessageCircle}
      iconTone="primary"
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <CopyButton
            value={message}
            label="Copy message"
            variant="primary"
            size="md"
            onCopied={() => show({ type: "success", title: "Message copied" })}
          />
        </div>
      }
    >
      <div className="space-y-5">
        <div>
          <p className="mb-2 text-[13px] font-medium leading-[18px] text-neutral-700">
            Quick template
          </p>
          <div role="group" aria-label="Quick template" className="flex flex-wrap gap-2">
            {REMINDER_TEMPLATES.map((t) => (
              <FilterPill
                key={t.value}
                label={t.label}
                selected={template === t.value}
                onClick={() => pick(t.value)}
              />
            ))}
          </div>
        </div>
        <Textarea
          label="Message"
          rows={5}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
        />
      </div>
    </Modal>
  );
}