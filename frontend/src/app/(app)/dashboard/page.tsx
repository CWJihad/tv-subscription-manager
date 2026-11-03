"use client";

import { PlaceholderPage } from "@/components/layout/PlaceholderPage";
import { deleteCustomer, renewCustomer } from "@/lib/api";

export default function DashboardPage() {
  return (
    <PlaceholderPage
      title="Dashboard"
      subtitle="Monday, October 5, 2026 · Here is who needs your attention today"
      withSearch
      showAddCustomer
    >
      <div className="mt-4 flex gap-3">
        <button
          type="button"
          className="btn btn-outline btn-sm"
          onClick={() => void renewCustomer("c_001", 3)}
        >
          Test: renew John Smith
        </button>
        <button
          type="button"
          className="btn btn-outline btn-sm"
          onClick={() => void deleteCustomer("c_006")}
        >
          Test: delete Robert Hall
        </button>
      </div>
    </PlaceholderPage>
  );
}