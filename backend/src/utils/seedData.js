// Seed data (seed-data.md). Dates are fixed and relative to MOCK_TODAY=2026-10-05.
// Phones are fake Bangladeshi numbers. Emails are fake and never used for real sending.

const PRICES = Object.freeze({ 3: 1500, 6: 2800, 12: 5000 });

const OWNER_NAME = "Alex Owner";
const EXPECTED_MOCK_TODAY = "2026-10-05";

// Renewal numbers (r_NNN, counted in insert order) with special payment rules.
const UNPAID_RENEWAL_NUMBER = 2; // r_002: John Smith's latest renewal, unpaid
const NO_PAYMENT_RENEWAL_NUMBER = 8; // r_008: James Cole, no payment record

// [number, fullName, customerSince, currentStartDate, durationMonths, expiryDate]
const ROWS = [
  [1, "John Smith", "2026-04-08", "2026-07-08", 3, "2026-10-08"],
  [2, "Michael Brown", "2026-07-12", "2026-07-12", 3, "2026-10-12"],
  [3, "Sarah Khan", "2026-10-05", "2026-10-05", 3, "2027-01-05"],
  [4, "David Lee", "2026-04-15", "2026-04-15", 6, "2026-10-15"],
  [5, "Emma Wilson", "2026-06-01", "2026-06-01", 12, "2027-06-01"],
  [6, "Robert Hall", "2026-04-03", "2026-04-03", 6, "2026-10-03"],
  [7, "James Cole", "2026-03-30", "2026-03-30", 6, "2026-09-30"],
  [8, "Priya Das", "2026-07-15", "2026-07-15", 3, "2026-10-15"],
  [9, "Rahim Uddin", "2026-08-10", "2026-08-10", 3, "2026-11-10"],
  [10, "Nusrat Jahan", "2026-07-20", "2026-07-20", 3, "2026-10-20"],
  [11, "Tanvir Ahmed", "2026-05-02", "2026-05-02", 6, "2026-11-02"],
  [12, "Farhana Akter", "2026-06-15", "2026-06-15", 6, "2026-12-15"],
  [13, "Mahmud Hasan", "2026-01-12", "2026-01-12", 12, "2027-01-12"],
  [14, "Sumaiya Islam", "2026-09-01", "2026-09-01", 3, "2026-12-01"],
  [15, "Imran Hossain", "2026-04-20", "2026-04-20", 6, "2026-10-20"],
  [16, "Shirin Sultana", "2025-11-05", "2025-11-05", 12, "2026-11-05"],
  [17, "Kamal Pasha", "2026-08-25", "2026-08-25", 3, "2026-11-25"],
  [18, "Tasnim Rahman", "2026-02-14", "2026-02-14", 12, "2027-02-14"],
  [19, "Arif Chowdhury", "2026-09-10", "2026-09-10", 6, "2027-03-10"],
  [20, "Mehzabin Noor", "2026-07-31", "2026-07-31", 3, "2026-10-31"],
  [21, "Sakib Khan", "2026-03-18", "2026-03-18", 12, "2027-03-18"],
  [22, "Rumana Begum", "2026-05-28", "2026-05-28", 6, "2026-11-28"],
  [23, "Jahid Karim", "2026-09-22", "2026-09-22", 3, "2026-12-22"],
  [24, "Lubna Yasmin", "2026-04-30", "2026-04-30", 6, "2026-10-30"],
  [25, "Nayeem Siddique", "2025-12-01", "2025-12-01", 12, "2026-12-01"],
  [26, "Ayesha Siddika", "2026-08-31", "2026-08-31", 6, "2027-02-28"],
  [27, "Fahim Reza", "2026-06-05", "2026-06-05", 12, "2027-06-05"],
  [28, "Mousumi Das", "2026-09-28", "2026-09-28", 3, "2026-12-28"],
  [29, "Rafiq Mia", "2026-07-16", "2026-07-16", 3, "2026-10-16"],
  [30, "Sadia Afrin", "2026-10-01", "2026-10-01", 6, "2027-04-01"],
];

const pad2 = (n) => String(n).padStart(2, "0");

const buildRenewals = (number, start, months, expiry) => {
  const current = { kind: "renewal", durationMonths: months, from: start, to: expiry };
  if (number === 1) {
    // John Smith: first 3-month period, then the current renewal.
    return [{ kind: "first", durationMonths: 3, from: "2026-04-08", to: "2026-07-08" }, current];
  }
  return [{ ...current, kind: "first" }];
};

const SEED_CUSTOMERS = ROWS.map(([number, fullName, since, start, months, expiry]) => ({
  fullName,
  email: `${fullName.split(" ")[0].toLowerCase()}@email.com`,
  phone: `+88017000000${pad2(number)}`,
  customerSince: since,
  currentStartDate: start,
  durationMonths: months,
  expiryDate: expiry,
  renewals: buildRenewals(number, start, months, expiry),
}));

module.exports = {
  PRICES,
  OWNER_NAME,
  EXPECTED_MOCK_TODAY,
  UNPAID_RENEWAL_NUMBER,
  NO_PAYMENT_RENEWAL_NUMBER,
  SEED_CUSTOMERS,
};