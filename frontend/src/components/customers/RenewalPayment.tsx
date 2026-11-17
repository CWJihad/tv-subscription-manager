import { PaymentBadge } from "@/components/customers/PaymentBadge";
import { getPaymentSummaryText } from "@/lib/payment";
import type { Payment } from "@/types";

interface RenewalPaymentProps {
  payment: Payment | null;
  onRecord: () => void;
}

/** One line per renewal: badge, amount/method/date, and the Record / Edit action. */
export function RenewalPayment({ payment, onRecord }: RenewalPaymentProps) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
      <PaymentBadge payment={payment} />
      {payment && (
        <span className="text-sm leading-5 text-neutral-700">{getPaymentSummaryText(payment)}</span>
      )}
      <button
        type="button"
        onClick={onRecord}
        className="rounded text-sm font-medium leading-5 text-primary-600 transition-colors hover:text-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
      >
        {payment ? "Edit payment" : "Record payment"}
      </button>
    </div>
  );
}