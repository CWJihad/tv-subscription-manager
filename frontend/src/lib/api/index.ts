// getCustomers, getCustomer, createCustomer, updateCustomer, renewCustomer, deleteCustomer, getDashboardSummary

import { countByStatus, sortExpired, sortExpiring } from "@/lib/customer-list";
import { DURATION_OPTIONS } from "@/lib/constants";
import { addMonths } from "@/lib/dates";
import { withStatus } from "@/lib/status";
import { getToday } from "@/lib/today";
import { hasErrors, validateContact, validateCreateCustomer } from "@/lib/validation";
import type {
  CreateCustomerInput,
  Customer,
  CustomerWithStatus,
  DashboardSummary,
  DurationMonths,
  Renewal,
  UpdateCustomerInput,
} from "@/types";
import { ApiError } from "./errors";
import {
  cloneCustomer,
  getList,
  nextCustomerId,
  nextRenewalId,
  setList,
  shouldFailSave,
  simulateLatency,
} from "./mock-store";
import {emitDataChanged} from './events'

export { ApiError } from "./errors";
export type { ApiErrorCode } from "./errors";

const VALIDATION_MESSAGE = "Please check the details and try again.";

function toView(customer: Customer): CustomerWithStatus {
  return withStatus(cloneCustomer(customer), getToday());
}

function requireCustomer(list: readonly Customer[], id: string): Customer {
  const customer = list.find((item) => item.id === id);
  if (!customer) throw new ApiError("NOT_FOUND", "Customer not found.");
  return customer;
}

export async function getCustomers(): Promise<CustomerWithStatus[]> {
  await simulateLatency();
  return getList().map(toView);
}

export async function getCustomer(id: string): Promise<CustomerWithStatus> {
  await simulateLatency();
  return toView(requireCustomer(getList(), id));
}

export async function createCustomer(input: CreateCustomerInput): Promise<CustomerWithStatus> {
  await simulateLatency();
  if (shouldFailSave()) throw new ApiError("UNKNOWN", VALIDATION_MESSAGE);

  const fieldErrors = validateCreateCustomer(input);
  if (hasErrors(fieldErrors)) throw new ApiError("VALIDATION", VALIDATION_MESSAGE, fieldErrors);

  const expiryDate = addMonths(input.startDate, input.durationMonths);
  const customer: Customer = {
    id: nextCustomerId(),
    fullName: input.fullName.trim(),
    email: input.email.trim(),
    phone: input.phone.trim(),
    customerSince: input.startDate,
    currentStartDate: input.startDate,
    durationMonths: input.durationMonths,
    expiryDate,
    renewals: [
      {
        id: nextRenewalId(),
        kind: "first",
        durationMonths: input.durationMonths,
        from: input.startDate,
        to: expiryDate,
      },
    ],
  };
  setList([...getList(), customer]);
  emitDataChanged();
  return toView(customer);
}

export async function updateCustomer(
  id: string,
  input: UpdateCustomerInput,
): Promise<CustomerWithStatus> {
  await simulateLatency();
  const list = getList();
  const current = requireCustomer(list, id);

  const fieldErrors = validateContact(input);
  if (hasErrors(fieldErrors)) throw new ApiError("VALIDATION", VALIDATION_MESSAGE, fieldErrors);

  const updated: Customer = {
    ...current,
    fullName: input.fullName.trim(),
    email: input.email.trim(),
    phone: input.phone.trim(),
  };
  setList(list.map((item) => (item.id === id ? updated : item)));
  emitDataChanged();
  return toView(updated);
}

/** New expiry = current expiry + duration (also for expired customers, default). */
export async function renewCustomer(
  id: string,
  durationMonths: DurationMonths,
): Promise<CustomerWithStatus> {
  await simulateLatency();
  if (!DURATION_OPTIONS.includes(durationMonths)) {
    throw new ApiError("VALIDATION", "Choose a valid renewal duration.");
  }
  const list = getList();
  const current = requireCustomer(list, id);

  const newExpiry = addMonths(current.expiryDate, durationMonths);
  const renewal: Renewal = {
    id: nextRenewalId(),
    kind: "renewal",
    durationMonths,
    from: current.expiryDate,
    to: newExpiry,
  };
  const updated: Customer = {
    ...current,
    currentStartDate: current.expiryDate,
    durationMonths,
    expiryDate: newExpiry,
    renewals: [...current.renewals, renewal],
  };
  setList(list.map((item) => (item.id === id ? updated : item)));
  emitDataChanged()
  return toView(updated);
}

export async function deleteCustomer(id: string): Promise<void> {
  await simulateLatency();
  const list = getList();
  requireCustomer(list, id);
  setList(list.filter((item) => item.id !== id));
  emitDataChanged();
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  await simulateLatency();
  const customers = getList().map(toView);
  const counts = countByStatus(customers);
  return {
    counts,
    needsAttention: counts.expiring + counts.expired,
    expiring: sortExpiring(customers.filter((customer) => customer.status === "expiring")),
    expired: sortExpired(customers.filter((customer) => customer.status === "expired")),
  };
}