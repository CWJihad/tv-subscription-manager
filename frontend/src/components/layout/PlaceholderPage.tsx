"use client";

import { useState, type ReactNode } from "react";
import { PageHeader } from "@/components/layout/PageHeader";

interface PlaceholderPageProps {
  title: string;
  subtitle?: string;
  withSearch?: boolean;
  showAddCustomer?: boolean;
  children?: ReactNode;
}

export function PlaceholderPage({
  title,
  subtitle,
  withSearch = false,
  showAddCustomer = false,
  children,
}: PlaceholderPageProps) {
  const [query, setQuery] = useState("");

  return (
    <>
      <PageHeader
        title={title}
        subtitle={subtitle}
        search={withSearch ? { value: query, onChange: setQuery } : undefined}
        showAddCustomer={showAddCustomer}
      />
      <div className="rounded-2xl border border-base-300 bg-base-100 p-6 text-sm text-[#64748B]">
        <p>Placeholder for {title}.</p>
        {withSearch && <p className="mt-2">Search value: “{query}”</p>}
        {children}
      </div>
    </>
  );
}