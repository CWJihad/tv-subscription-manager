"use client";

import { useState, type ReactNode } from "react";
import { RenewModal } from "@/components/customers/RenewModal";
import { ReminderModal } from "@/components/customers/ReminderModal";
import type { CustomerWithStatus } from "@/types";

export function useCustomerModals(onChanged?: () => void): {
  openRenew: (customer: CustomerWithStatus) => void;
  openReminder: (customer: CustomerWithStatus) => void;
  modals: ReactNode;
} {
  const [renewTarget, setRenewTarget] = useState<CustomerWithStatus | null>(null);
  const [reminderTarget, setReminderTarget] = useState<CustomerWithStatus | null>(null);

  const modals = (
    <>
      <RenewModal
        customer={renewTarget}
        onClose={() => setRenewTarget(null)}
        onRenewed={onChanged}
      />
      <ReminderModal customer={reminderTarget} onClose={() => setReminderTarget(null)} />
    </>
  );

  return {
    openRenew: (customer) => setRenewTarget(customer),
    openReminder: (customer) => setReminderTarget(customer),
    modals,
  };
}