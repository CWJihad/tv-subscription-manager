const test = require("node:test");
const assert = require("node:assert/strict");
const { addDays, addMonths, formatDateOnly, parseDateOnly } = require("../../src/utils/dates");
const { getStatus, getExpiringBucket } = require("../../src/utils/status");
const { SEED_CUSTOMERS, EXPECTED_MOCK_TODAY } = require("../../src/utils/seedData");
const { buildDemoCustomers } = require("../../src/utils/demoDates");

const seedDay = parseDateOnly(EXPECTED_MOCK_TODAY);
const DAYS_TO_CHECK = 800; // more than two years, includes a leap day

const summarize = (customers, today) => {
  const counts = { total: customers.length, active: 0, expiring: 0, expired: 0 };
  const buckets = { "1-3": 0, "4-7": 0, "8-10": 0 };
  for (const customer of customers) {
    const { status, daysLeft } = getStatus(parseDateOnly(customer.expiryDate), today);
    counts[status] += 1;
    if (status === "expiring") buckets[getExpiringBucket(daysLeft)] += 1;
  }
  return { counts, buckets };
};

test("on the seed day the demo data is identical to the fixed seed", () => {
  assert.deepEqual(buildDemoCustomers(SEED_CUSTOMERS, seedDay), SEED_CUSTOMERS);
});

test(`for ${DAYS_TO_CHECK} consecutive days: same counts and valid, contiguous periods`, () => {
  for (let offset = 0; offset < DAYS_TO_CHECK; offset += 1) {
    const today = addDays(seedDay, offset);
    const label = formatDateOnly(today);
    const demo = buildDemoCustomers(SEED_CUSTOMERS, today);

    const { counts, buckets } = summarize(demo, today);
    assert.deepEqual(counts, { total: 30, active: 24, expiring: 4, expired: 2 }, `counts on ${label}`);
    assert.equal(buckets["1-3"] + buckets["4-7"] + buckets["8-10"], 4, `buckets on ${label}`);

    demo.forEach((customer, index) => {
      const seed = SEED_CUSTOMERS[index];
      const who = `${customer.fullName} on ${label}`;
      assert.equal(customer.fullName, seed.fullName);
      assert.equal(customer.phone, seed.phone);
      assert.equal(customer.email, seed.email);

      const last = customer.renewals[customer.renewals.length - 1];
      assert.equal(customer.renewals.length, seed.renewals.length, who);
      assert.equal(customer.expiryDate, last.to, who);
      assert.equal(customer.currentStartDate, last.from, who);
      assert.equal(customer.durationMonths, last.durationMonths, who);
      assert.equal(customer.customerSince, customer.renewals[0].from, who);

      customer.renewals.forEach((period, i) => {
        const from = parseDateOnly(period.from);
        assert.equal(period.to, formatDateOnly(addMonths(from, period.durationMonths)), `${who}: to = from + months`);
        assert.ok(from.getTime() <= today.getTime(), `${who}: start is not in the future`);
        assert.equal(period.kind, seed.renewals[i].kind, who);
        if (i > 0) assert.equal(customer.renewals[i - 1].to, period.from, `${who}: periods are contiguous`);
      });
    });
  }
});

test("exact buckets (1-3: 1, 4-7: 1, 8-10: 2) hold on almost every day", () => {
  let exact = 0;
  for (let offset = 0; offset < DAYS_TO_CHECK; offset += 1) {
    const today = addDays(seedDay, offset);
    const { buckets } = summarize(buildDemoCustomers(SEED_CUSTOMERS, today), today);
    if (buckets["1-3"] === 1 && buckets["4-7"] === 1 && buckets["8-10"] === 2) exact += 1;
  }
  assert.ok(exact / DAYS_TO_CHECK >= 0.95, `exact buckets on ${exact} of ${DAYS_TO_CHECK} days`);
});
