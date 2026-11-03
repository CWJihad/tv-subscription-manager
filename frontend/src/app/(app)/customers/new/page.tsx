import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CustomerForm } from "@/components/customers/CustomerForm";
import { PageHeader } from "@/components/layout/PageHeader";

export default function NewCustomerPage() {
  return (
    <>
      <Link
        href="/customers"
        className="mb-3 inline-flex items-center gap-1 text-sm font-semibold text-primary-600 hover:text-primary-700"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Customers
      </Link>
      <PageHeader
        title="Add Customer"
        subtitle="Save a customer and their subscription. The expiry date is worked out for you."
      />
      <CustomerForm mode="create" />
    </>
  );
}