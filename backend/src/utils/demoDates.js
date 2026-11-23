// Demo seed dates. The fixed seed (seedData.js) is written for 2026-10-05.
// This moves it to "today" so a demo always looks like the design:
// 4 expiring, 2 expired, 24 active. Every period stays valid: to = from + months (month-end clamped).
const { parseDateOnly, formatDateOnly, addDays, addMonths, diffDays } = require("./dates");
const { getStatus, getExpiringBucket } = require("./status");
const { EXPECTED_MOCK_TODAY } = require("./seedData");

const SEED_BASE = parseDateOnly(EXPECTED_MOCK_TODAY);

// Days the expiry may move to find a valid month-end combination (tried in this order).
const NUDGES = Object.freeze([0, -1, 1, -2, 2, -3, 3, -4, 4, -5, 5]);

const daysInMonth = (year, monthIndex) => new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();

/** "expired", "active", or the expiring bucket ("1-3", "4-7", "8-10"). */
const bucketOf = (expiry, today) => {
  const { status, daysLeft } = getStatus(expiry, today);
  return status === "expiring" ? getExpiringBucket(daysLeft) : status;
};

/** "expired", "expiring" or "active". */
const statusOf = (expiry, today) => getStatus(expiry, today).status;

/** All start dates whose start + months equals `end`, nearest to `desired` first. */
const startCandidates = (end, months, desired) => {
  const probe = addMonths(end, -months); // every valid start is in this month
  const year = probe.getUTCFullYear();
  const month = probe.getUTCMonth();
  const found = [];
  for (let day = 1; day <= daysInMonth(year, month); day += 1) {
    const start = new Date(Date.UTC(year, month, day));
    if (addMonths(start, months).getTime() === end.getTime()) found.push(start);
  }
  return found.sort((a, b) => Math.abs(diffDays(a, desired)) - Math.abs(diffDays(b, desired)));
};

/** Builds the renewal chain backwards from the last expiry. Starts are never in the future. */
const findChain = (periods, index, end, shift, today) => {
  const period = periods[index];
  const starts = startCandidates(end, period.durationMonths, shift(period.from)).filter(
    (start) => start.getTime() <= today.getTime()
  );
  for (const start of starts) {
    const current = { kind: period.kind, durationMonths: period.durationMonths, from: start, to: end };
    if (index === 0) return [current];
    const earlier = findChain(periods, index - 1, start, shift, today);
    if (earlier) return [...earlier, current];
  }
  return null;
};

const toDemoCustomer = (seed, chain) => {
  const first = chain[0];
  const last = chain[chain.length - 1];
  return {
    ...seed,
    customerSince: formatDateOnly(first.from),
    currentStartDate: formatDateOnly(last.from),
    durationMonths: last.durationMonths,
    expiryDate: formatDateOnly(last.to),
    renewals: chain.map((period) => ({
      kind: period.kind,
      durationMonths: period.durationMonths,
      from: formatDateOnly(period.from),
      to: formatDateOnly(period.to),
    })),
  };
};

const buildDemoCustomer = (seed, today) => {
  const shift = (iso) => addDays(today, diffDays(parseDateOnly(iso), SEED_BASE));
  const idealEnd = shift(seed.expiryDate);

  // First keep the exact bucket. If a month-end gap makes that impossible, keep only the status.
  for (const classify of [bucketOf, statusOf]) {
    const wanted = classify(idealEnd, today);
    for (const nudge of NUDGES) {
      const end = addDays(idealEnd, nudge);
      if (classify(end, today) !== wanted) continue;
      const chain = findChain(seed.renewals, seed.renewals.length - 1, end, shift, today);
      if (chain) return toDemoCustomer(seed, chain);
    }
  }
  throw new Error(`Could not build demo dates for ${seed.fullName}`);
};

/** seedCustomers: SEED_CUSTOMERS shape. today: Date at 00:00Z. Returns the same shape with shifted dates. */
const buildDemoCustomers = (seedCustomers, today) => seedCustomers.map((seed) => buildDemoCustomer(seed, today));

module.exports = { buildDemoCustomers };
