const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { parseDateOnly: d, formatDateOnly: f } = require("../../src/utils/dates");
const { getRenewalBase, calcExpiry } = require("../../src/utils/subscription");
const { SEED_CUSTOMERS } = require("../../src/utils/seedData");

const TODAY = d("2026-10-05");

describe("getRenewalBase (D6: max(currentExpiry, today))", () => {
  it("uses the current expiry when it is in the future", () => {
    assert.equal(f(getRenewalBase(d("2026-10-08"), TODAY)), "2026-10-08");
  });

  it("uses today when the subscription already expired", () => {
    assert.equal(f(getRenewalBase(d("2026-10-03"), TODAY)), "2026-10-05");
    assert.equal(f(getRenewalBase(d("2026-09-30"), TODAY)), "2026-10-05");
  });

  it("uses today when it expires today", () => {
    assert.equal(f(getRenewalBase(TODAY, TODAY)), "2026-10-05");
  });
});

describe("renew vectors (spec section 8)", () => {
  it("John +3 months: base 2026-10-08, new expiry 2027-01-08", () => {
    const base = getRenewalBase(d("2026-10-08"), TODAY);
    assert.equal(f(base), "2026-10-08");
    assert.equal(f(calcExpiry(base, 3)), "2027-01-08");
  });

  it("Robert Hall +3 months: base today, new expiry 2027-01-05", () => {
    const base = getRenewalBase(d("2026-10-03"), TODAY);
    assert.equal(f(base), "2026-10-05");
    assert.equal(f(calcExpiry(base, 3)), "2027-01-05");
  });

  it("clamps month ends when renewing", () => {
    assert.equal(f(calcExpiry(d("2026-08-31"), 6)), "2027-02-28");
    assert.equal(f(calcExpiry(d("2027-08-31"), 6)), "2028-02-29");
  });
});

describe("calcExpiry", () => {
  it("adds 3, 6 and 12 months", () => {
    assert.equal(f(calcExpiry(d("2026-10-05"), 3)), "2027-01-05");
    assert.equal(f(calcExpiry(d("2026-10-05"), 6)), "2027-04-05");
    assert.equal(f(calcExpiry(d("2026-10-05"), 12)), "2027-10-05");
  });
});

describe("seed data consistency", () => {
  it("every renewal ends at from + duration, and the last one matches the customer", () => {
    for (const customer of SEED_CUSTOMERS) {
      for (const renewal of customer.renewals) {
        assert.equal(f(calcExpiry(d(renewal.from), renewal.durationMonths)), renewal.to, `${customer.fullName} ${renewal.from}`);
      }
      const last = customer.renewals[customer.renewals.length - 1];
      assert.equal(last.to, customer.expiryDate, customer.fullName);
      assert.equal(last.from, customer.currentStartDate, customer.fullName);
      assert.equal(last.durationMonths, customer.durationMonths, customer.fullName);
    }
  });
});