// 8 named + 22 fixed generated active customers (30 total)

import { addMonths } from "@/lib/dates";
import type { Customer, DurationMonths } from "@/types";

/** 8 named customers from the design. */
const NAMED_CUSTOMERS: readonly Customer[] = [
  {
    id: "c_001",
    fullName: "John Smith",
    email: "john@email.com",
    phone: "+1 555 012 3456",
    customerSince: "2026-04-08",
    currentStartDate: "2026-07-08",
    durationMonths: 3,
    expiryDate: "2026-10-08",
    renewals: [
      { id: "r_001", kind: "first", durationMonths: 3, from: "2026-04-08", to: "2026-07-08" },
      { id: "r_002", kind: "renewal", durationMonths: 3, from: "2026-07-08", to: "2026-10-08" },
    ],
  },
  {
    id: "c_002",
    fullName: "Michael Brown",
    email: "michael@email.com",
    phone: "+1 555 013 7788",
    customerSince: "2026-07-12",
    currentStartDate: "2026-07-12",
    durationMonths: 3,
    expiryDate: "2026-10-12",
    renewals: [{ id: "r_003", kind: "first", durationMonths: 3, from: "2026-07-12", to: "2026-10-12" }],
  },
  {
    id: "c_003",
    fullName: "Sarah Khan",
    email: "sarah@email.com",
    phone: "+1 555 019 2210",
    customerSince: "2026-10-05",
    currentStartDate: "2026-10-05",
    durationMonths: 3,
    expiryDate: "2027-01-05",
    renewals: [{ id: "r_004", kind: "first", durationMonths: 3, from: "2026-10-05", to: "2027-01-05" }],
  },
  {
    id: "c_004",
    fullName: "David Lee",
    email: "david@email.com",
    phone: "+1 555 014 6621",
    customerSince: "2026-04-15",
    currentStartDate: "2026-04-15",
    durationMonths: 6,
    expiryDate: "2026-10-15",
    renewals: [{ id: "r_005", kind: "first", durationMonths: 6, from: "2026-04-15", to: "2026-10-15" }],
  },
  {
    id: "c_005",
    fullName: "Emma Wilson",
    email: "emma@email.com",
    phone: "+1 555 011 9034",
    customerSince: "2026-06-01",
    currentStartDate: "2026-06-01",
    durationMonths: 12,
    expiryDate: "2027-06-01",
    renewals: [{ id: "r_006", kind: "first", durationMonths: 12, from: "2026-06-01", to: "2027-06-01" }],
  },
  {
    id: "c_006",
    fullName: "Robert Hall",
    email: "robert@email.com",
    phone: "+1 555 017 4410",
    customerSince: "2026-04-03",
    currentStartDate: "2026-04-03",
    durationMonths: 6,
    expiryDate: "2026-10-03",
    renewals: [{ id: "r_007", kind: "first", durationMonths: 6, from: "2026-04-03", to: "2026-10-03" }],
  },
  {
    // Design values kept as-is: Jan 30 + 6 months does not equal Sep 30 (open question 9).
    id: "c_007",
    fullName: "James Cole",
    email: "james@email.com",
    phone: "+1 555 018 2965",
    customerSince: "2026-01-30",
    currentStartDate: "2026-01-30",
    durationMonths: 6,
    expiryDate: "2026-09-30",
    renewals: [{ id: "r_008", kind: "first", durationMonths: 6, from: "2026-01-30", to: "2026-09-30" }],
  },
  {
    // Start date and duration are not in the design (assumed).
    id: "c_008",
    fullName: "Priya Das",
    email: "priya@email.com",
    phone: "+1 555 016 8802",
    customerSince: "2026-07-15",
    currentStartDate: "2026-07-15",
    durationMonths: 3,
    expiryDate: "2026-10-15",
    renewals: [{ id: "r_009", kind: "first", durationMonths: 3, from: "2026-07-15", to: "2026-10-15" }],
  },
];

type GeneratedSeed = readonly [
  id: string,
  fullName: string,
  phone: string,
  expiryDate: string,
  durationMonths: DurationMonths,
];

/** 22 fixed ACTIVE customers (all expire after Oct 15, 2026). No randomness. */
const GENERATED_SEEDS: readonly GeneratedSeed[] = [
  ["c_009", "Olivia Martin", "+1 555 021 4471", "2026-10-20", 3],
  ["c_010", "Daniel Carter", "+1 555 022 8305", "2026-11-03", 6],
  ["c_011", "Sophia Reyes", "+1 555 023 1962", "2027-03-14", 12],
  ["c_012", "Liam Turner", "+1 555 024 7710", "2026-12-12", 3],
  ["c_013", "Ava Patel", "+1 555 025 3348", "2027-01-18", 6],
  ["c_014", "Noah Bennett", "+1 555 026 9054", "2027-08-09", 12],
  ["c_015", "Isabella Cruz", "+1 555 027 6183", "2026-11-22", 3],
  ["c_016", "Ethan Brooks", "+1 555 028 2597", "2026-12-01", 6],
  ["c_017", "Mia Rahman", "+1 555 029 8826", "2027-02-20", 12],
  ["c_018", "Lucas Foster", "+1 555 030 4139", "2026-10-28", 3],
  ["c_019", "Charlotte Nguyen", "+1 555 031 7752", "2027-03-25", 6],
  ["c_020", "Mason Ortiz", "+1 555 032 0968", "2027-05-10", 12],
  ["c_021", "Amelia Gray", "+1 555 033 5214", "2026-12-27", 3],
  ["c_022", "Logan Hughes", "+1 555 034 6670", "2026-11-15", 6],
  ["c_023", "Harper Singh", "+1 555 035 1893", "2027-09-02", 12],
  ["c_024", "Elijah Moore", "+1 555 036 4427", "2027-01-02", 3],
  ["c_025", "Evelyn Diaz", "+1 555 037 9301", "2027-02-08", 6],
  ["c_026", "Benjamin Ross", "+1 555 038 2756", "2027-01-15", 12],
  ["c_027", "Zara Ahmed", "+1 555 039 8044", "2026-11-09", 3],
  ["c_028", "Henry Price", "+1 555 040 3615", "2027-04-04", 6],
  ["c_029", "Layla Hossain", "+1 555 041 5588", "2027-06-18", 12],
  ["c_030", "Jack Morgan", "+1 555 042 7920", "2026-10-16", 3], // 11 days left: active boundary
];

function buildCustomer([id, fullName, phone, expiryDate, durationMonths]: GeneratedSeed): Customer {
  const startDate = addMonths(expiryDate, -durationMonths);
  const firstName = fullName.split(" ")[0]?.toLowerCase() ?? "customer";
  return {
    id,
    fullName,
    email: `${firstName}@email.com`,
    phone,
    customerSince: startDate,
    currentStartDate: startDate,
    durationMonths,
    expiryDate,
    renewals: [
      { id: `r_${id}`, kind: "first", durationMonths, from: startDate, to: expiryDate },
    ],
  };
}

/** 30 customers. With today = 2026-10-05: Active 24, Expiring 4, Expired 2. */
export const SEED_CUSTOMERS: readonly Customer[] = [
  ...NAMED_CUSTOMERS,
  ...GENERATED_SEEDS.map(buildCustomer),
];