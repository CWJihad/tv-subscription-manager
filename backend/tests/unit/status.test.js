const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { parseDateOnly: d, addDays } = require("../../src/utils/dates");
const { getStatus, getExpiringBucket, getStatusRanges } = require("../../src/utils/status");
const { SEED_CUSTOMERS } = require("../../src/utils/seedData");

const TODAY = d("2026-10-05"); // MOCK_TODAY of the spec vectors

/** Evaluates a Mongo-style { $gt, $gte, $lt, $lte } range against a Date. */
const matches = (range, date) =>
  Object.entries(range).every(([op, bound]) => {
    const t = date.getTime();
    const b = bound.getTime();
    if (op === "$gt") return t > b;
    if (op === "$gte") return t >= b;
    if (op === "$lt") return t < b;
    if (op === "$lte") return t <= b;
    throw new Error(`Unknown operator ${op}`);
  });

describe("getStatus (spec section 8 vectors)", () => {
  const cases = [
    ["John Smith", "2026-10-08", "expiring", 3],
    ["Michael Brown", "2026-10-12", "expiring", 7],
    ["David Lee", "2026-10-15", "expiring", 10],
    ["Priya Das", "2026-10-15", "expiring", 10],
    ["Robert Hall", "2026-10-03", "expired", -2],
    ["James Cole", "2026-09-30", "expired", -5],
    ["Sarah Khan", "2027-01-05", "active", 92],
    ["Emma Wilson", "2027-06-01", "active", 239],
    ["Rafiq Mia", "2026-10-16", "active", 11],
  ];

  for (const [name, expiry, status, daysLeft] of cases) {
    it(`${name}: ${status}, ${daysLeft} days`, () => {
      assert.deepEqual(getStatus(d(expiry), TODAY), { status, daysLeft });
    });
  }

  it("expires today = expiring with 0 days", () => {
    assert.deepEqual(getStatus(TODAY, TODAY), { status: "expiring", daysLeft: 0 });
  });

  it("yesterday = expired with -1", () => {
    assert.deepEqual(getStatus(addDays(TODAY, -1), TODAY), { status: "expired", daysLeft: -1 });
  });
});

describe("getExpiringBucket", () => {
  it("maps days left to buckets (0 goes to 1-3)", () => {
    assert.equal(getExpiringBucket(0), "1-3");
    assert.equal(getExpiringBucket(1), "1-3");
    assert.equal(getExpiringBucket(3), "1-3");
    assert.equal(getExpiringBucket(4), "4-7");
    assert.equal(getExpiringBucket(7), "4-7");
    assert.equal(getExpiringBucket(8), "8-10");
    assert.equal(getExpiringBucket(10), "8-10");
  });

  it("returns null outside the window", () => {
    assert.equal(getExpiringBucket(11), null);
    assert.equal(getExpiringBucket(-1), null);
  });
});

describe("getStatusRanges", () => {
  const ranges = getStatusRanges(TODAY);

  it("has the documented bounds", () => {
    assert.equal(ranges.active.$gt.toISOString(), "2026-10-15T00:00:00.000Z");
    assert.equal(ranges.expiring.$gte.toISOString(), "2026-10-05T00:00:00.000Z");
    assert.equal(ranges.expiring.$lte.toISOString(), "2026-10-15T00:00:00.000Z");
    assert.equal(ranges.expired.$lt.toISOString(), "2026-10-05T00:00:00.000Z");
    assert.equal(ranges.buckets["1-3"].$lte.toISOString(), "2026-10-08T00:00:00.000Z");
    assert.equal(ranges.buckets["4-7"].$gte.toISOString(), "2026-10-09T00:00:00.000Z");
    assert.equal(ranges.buckets["4-7"].$lte.toISOString(), "2026-10-12T00:00:00.000Z");
    assert.equal(ranges.buckets["8-10"].$gte.toISOString(), "2026-10-13T00:00:00.000Z");
  });

  it("matches getStatus and getExpiringBucket for every day from -5 to +20", () => {
    for (let offset = -5; offset <= 20; offset += 1) {
      const date = addDays(TODAY, offset);
      const { status } = getStatus(date, TODAY);

      const hits = ["active", "expiring", "expired"].filter((key) => matches(ranges[key], date));
      assert.deepEqual(hits, [status], `offset ${offset}`);

      const bucketHits = Object.keys(ranges.buckets).filter((key) => matches(ranges.buckets[key], date));
      const expected = getExpiringBucket(offset);
      assert.deepEqual(bucketHits, expected ? [expected] : [], `bucket offset ${offset}`);
    }
  });
});

describe("seed data stats (spec section 8)", () => {
  it("gives total 30, active 24, expiring 4, expired 2 and the bucket counts", () => {
    const counts = { total: 0, active: 0, expiring: 0, expired: 0 };
    const buckets = { "1-3": 0, "4-7": 0, "8-10": 0 };

    for (const customer of SEED_CUSTOMERS) {
      const { status, daysLeft } = getStatus(d(customer.expiryDate), TODAY);
      counts.total += 1;
      counts[status] += 1;
      const bucket = getExpiringBucket(daysLeft);
      if (bucket) buckets[bucket] += 1;
    }

    assert.deepEqual(counts, { total: 30, active: 24, expiring: 4, expired: 2 });
    assert.deepEqual(buckets, { "1-3": 1, "4-7": 1, "8-10": 2 });
  });
});