"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { CustomerForm } from "@/components/customers/CustomerForm";
import { PageHeader } from "@/components/layout/PageHeader";
import { getCustomer } from "@/lib/api";
import type { CustomerWithStatus } from "@/types";

export default function EditCustomerPage() {
  const { id } = useParams<{ id: string }>();
  const [customer, setCustomer] = useState<CustomerWithStatus | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getCustomer(id)
      .then((data) => {
        if (!cancelled) setCustomer(data);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  return (
    <>
      <Link
        href={`/customers/${id}`}
        className="mb-3 inline-flex items-center gap-1 text-sm font-semibold text-primary-600 hover:text-primary-700"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Customer
      </Link>
      <PageHeader title="Edit Customer" subtitle="Update the customer's contact details." />
      {failed && <p className="text-sm text-danger-700">Customer not found.</p>}
      {customer && <CustomerForm mode="edit" customer={customer} />}
      {!customer && !failed && <div className="skeleton h-64 w-full max-w-[720px]" aria-busy="true" />}
    </>
  );
}