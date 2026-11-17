"use client";

import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Calendar, Check, Mail, Phone, User } from "lucide-react";
import { PaymentFields } from "@/components/customers/PaymentFields";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { RadioCard } from "@/components/ui/RadioCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { usePaymentForm } from "@/hooks/usePaymentForm";
import { usePrices } from "@/hooks/usePrices";
import { useToast } from "@/hooks/useToast";
import { ApiError, createCustomer, updateCustomer } from "@/lib/api";
import { validateCustomer } from "@/lib/customer-validation";
import { addMonths, isValidISODate } from "@/lib/dates";
import {
  formatDuration,
  formatLongDate,
  getExpiredAgoLabel,
  getRemainingLabel,
} from "@/lib/format";
import { getStatus } from "@/lib/status";
import { getToday } from "@/lib/today";
import type { CustomerFieldErrors, CustomerWithStatus, DurationMonths } from "@/types";

const DURATIONS: DurationMonths[] = [3, 6, 12];
const SAVE_ERROR_FALLBACK = "Please check the details and try again.";

export interface CustomerFormProps {
  mode: "create" | "edit";
  customer?: CustomerWithStatus;
}

export function CustomerForm({ mode, customer }: CustomerFormProps) {
  const router = useRouter();
  const { show } = useToast();
  const today = getToday();
  const isCreate = mode === "create";

  const [fullName, setFullName] = useState(customer?.fullName ?? "");
  const [phone, setPhone] = useState(customer?.phone ?? "");
  const [email, setEmail] = useState(customer?.email ?? "");
  const [startDate, setStartDate] = useState(today);
  const [duration, setDuration] = useState<DurationMonths>(3);
  const [errors, setErrors] = useState<CustomerFieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  // Blocks a second submit immediately, before React re-renders the disabled button.
  const submittingRef = useRef(false);

  // Optional payment block (create mode only). Off by default. Prices load only in create mode.
  const { prices } = usePrices(isCreate);
  const payment = usePaymentForm({ prices, durationMonths: duration, defaultEnabled: false });

  const validStart = isValidISODate(startDate);
  const expiry = validStart ? addMonths(startDate, duration) : null;
  const info = expiry ? getStatus(expiry, today) : null;
  const statusLabel = !info
    ? ""
    : info.status === "active"
      ? `Active · ${info.daysLeft} days left`
      : info.status === "expiring"
        ? getRemainingLabel(info.daysLeft)
        : getExpiredAgoLabel(info.daysLeft);

  const backHref = isCreate || !customer ? "/customers" : `/customers/${customer.id}`;

  const resetForm = () => {
    setFullName("");
    setPhone("");
    setEmail("");
    setStartDate(today);
    setDuration(3);
    setErrors({});
    payment.reset();
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (submittingRef.current) return; // double submit
    if (!isCreate && !customer) return;

    const found = validateCustomer({
      fullName,
      email,
      phone,
      startDate: isCreate ? startDate : undefined,
    });
    setErrors(found);
    // Run both checks so every error shows at once.
    const paymentOk = isCreate ? payment.validate() : true;
    if (Object.keys(found).length > 0 || !paymentOk) return;

    const savedName = fullName.trim();
    const paymentInput = isCreate ? payment.toInput() : undefined;
    submittingRef.current = true;
    setSubmitting(true);

    try {
      if (isCreate) {
        await createCustomer({
          fullName: savedName,
          email: email.trim(),
          phone: phone.trim(),
          startDate,
          durationMonths: duration,
          ...(paymentInput ? { payment: paymentInput } : {}),
        });
      } else if (customer) {
        await updateCustomer(customer.id, {
          fullName: savedName,
          email: email.trim(),
          phone: phone.trim(),
        });
      }
    } catch (error) {
      const apiError = error instanceof ApiError ? error : null;
      // Server-side field errors (duplicate phone, invalid phone, ...) go under the fields.
      if (apiError?.fieldErrors) setErrors(apiError.fieldErrors);
      show({
        type: "error",
        title: "Could not save customer",
        message: apiError?.message ?? SAVE_ERROR_FALLBACK,
      });
      return; // finally still runs
    } finally {
      // Always runs: success, error or early return. The button can never stay loading.
      submittingRef.current = false;
      setSubmitting(false);
    }

    // Saved. Nothing below can leave the button in the loading state.
    if (isCreate) resetForm(); // also stops an accidental second click from creating a duplicate
    router.push(backHref);
    show({
      type: "success",
      title: isCreate ? "Customer added" : "Customer updated",
      message: savedName,
    });
  };

  const card = "rounded-2xl border border-neutral-200 bg-neutral-0 p-6";

  return (
    <form
      noValidate
      onSubmit={submit}
      className={isCreate ? "grid gap-5 lg:grid-cols-[1fr_360px]" : "max-w-[720px]"}
    >
      <div className={card}>
        <h2 className="mb-4 text-[18px] font-semibold leading-[26px] text-neutral-900">
          Customer information
        </h2>
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Full name"
              leftIcon={User}
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              error={errors.fullName}
              placeholder="Sarah Khan"
              autoComplete="off"
            />
            <Input
              label="Phone number"
              leftIcon={Phone}
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              error={errors.phone}
              placeholder="01712345678"
              type="tel"
              autoComplete="off"
            />
          </div>
          <Input
            label="Email"
            leftIcon={Mail}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            error={errors.email}
            placeholder="sarah@email.com"
            type="email"
            autoComplete="off"
          />
        </div>

        {isCreate && (
          <>
            <hr className="my-6 border-neutral-200" />
            <h3 className="mb-4 text-[18px] font-semibold leading-[26px] text-neutral-900">
              Subscription
            </h3>
            <div className="space-y-4">
              <Input
                label="Subscription start date"
                leftIcon={Calendar}
                type="date"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
                error={errors.startDate}
              />
              <div>
                <p className="mb-2 text-[13px] font-medium leading-[18px] text-neutral-700">
                  Subscription duration
                </p>
                <div
                  role="radiogroup"
                  aria-label="Subscription duration"
                  className="grid gap-3 sm:grid-cols-3"
                >
                  {DURATIONS.map((m) => (
                    <RadioCard
                      key={m}
                      name="duration"
                      value={String(m)}
                      checked={duration === m}
                      onChange={() => setDuration(m)}
                      title={`${m} months`}
                      description={validStart ? `Ends ${formatLongDate(addMonths(startDate, m))}` : ""}
                    />
                  ))}
                </div>
              </div>

              <PaymentFields
                enabled={payment.enabled}
                onEnabledChange={payment.setEnabled}
                values={payment.values}
                errors={payment.errors}
                onChange={payment.setField}
                disabled={submitting}
              />
            </div>
          </>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(backHref)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={submitting}
            leftIcon={<Check className="size-4" aria-hidden="true" />}
          >
            {isCreate ? "Add Customer" : "Save changes"}
          </Button>
        </div>
      </div>

      {isCreate && (
        <aside className={`${card} h-fit`} aria-label="Subscription summary">
          <h2 className="mb-4 text-[18px] font-semibold leading-[26px] text-neutral-900">
            Subscription summary
          </h2>
          <dl className="space-y-3 text-sm leading-[22px]">
            <div className="flex justify-between">
              <dt className="text-neutral-500">Start date</dt>
              <dd className="font-medium text-neutral-900">
                {validStart ? formatLongDate(startDate) : "—"}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-neutral-500">Duration</dt>
              <dd className="font-medium text-neutral-900">{formatDuration(duration)}</dd>
            </div>
          </dl>
          <div className="mt-4 rounded-xl bg-primary-50 px-4 py-3">
            <p className="text-xs leading-[18px] text-neutral-500">Expiration date</p>
            <p className="text-[22px] font-semibold leading-[30px] text-primary-600">
              {expiry ? formatLongDate(expiry) : "—"}
            </p>
            <p className="text-xs leading-[18px] text-neutral-500">Calculated automatically</p>
          </div>
          {info && (
            <div className="mt-4 flex items-center justify-between">
              <span className="text-sm leading-[22px] text-neutral-500">Status after saving</span>
              <StatusBadge status={info.status} label={statusLabel} />
            </div>
          )}
        </aside>
      )}
    </form>
  );
}