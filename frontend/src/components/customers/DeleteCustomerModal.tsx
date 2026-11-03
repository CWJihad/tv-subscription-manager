"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/hooks/useToast";
import { deleteCustomer } from "@/lib/api";
import type { CustomerWithStatus } from "@/types";

export interface DeleteCustomerModalProps {
  customer: CustomerWithStatus | null;
  onClose: () => void;
  onDeleted: () => void;
}

export function DeleteCustomerModal({ customer, onClose, onDeleted }: DeleteCustomerModalProps) {
  if (!customer) return null;
  return (
    <DeleteContent key={customer.id} customer={customer} onClose={onClose} onDeleted={onDeleted} />
  );
}

function DeleteContent({
  customer,
  onClose,
  onDeleted,
}: {
  customer: CustomerWithStatus;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const { show } = useToast();
  const [deleting, setDeleting] = useState(false);

  const confirm = async () => {
    setDeleting(true);
    try {
      await deleteCustomer(customer.id);
      show({ type: "success", title: "Customer deleted", message: customer.fullName });
      onDeleted();
    } catch {
      setDeleting(false);
      show({ type: "error", title: "Could not delete customer", message: "Please try again." });
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={`Delete ${customer.fullName}?`}
      icon={Trash2}
      iconTone="danger"
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={deleting}>
            Cancel
          </Button>
          <Button
            variant="danger"
            loading={deleting}
            leftIcon={<Trash2 className="size-4" aria-hidden="true" />}
            onClick={confirm}
          >
            Delete customer
          </Button>
        </div>
      }
    >
      <p className="text-sm leading-[22px] text-neutral-700">
        This permanently removes the customer and their subscription records. This cannot be undone.
      </p>
    </Modal>
  );
}