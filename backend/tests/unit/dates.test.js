const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const {
  parseDateOnly,
  formatDateOnly,
  addDays,
  addMonths,
  diffDays,
  isValidDateOnly,
  startOfMonth,
} = require("../../src/utils/dates");

const d = parseDateOnly;
const f = formatDateOnly;

describe("isValidDateOnly", () => {
  it("accepts real calendar dates", () => {
    assert.equal(isValidDateOnly("2026-10-05"), true);
    assert.equal(isValidDateOnly("2028-02-29"), true);
  });

  it("rejects bad formats and impossible dates", () => {
    for (const value of ["2026-02-29", "2026-13-01", "2026-04-31", "2026-1-5", "", "2026-10-05T00:00:00Z", null, undefined, 20261005]) {
      assert.equal(isValidDateOnly(value), false, String(value));
    }
  });
});

describe("parseDateOnly / formatDateOnly", () => {
  it("parses to UTC midnight", () => {
    assert.equal(d("2026-10-05").toISOString(), "2026-10-05T00:00:00.000Z");
  });

  it("round-trips", () => {
    assert.equal(f(d("2027-01-05")), "2027-01-05");
  });

  it("throws on invalid input", () => {
    assert.throws(() => d("2026-02-30"), /Invalid date/);
    assert.throws(() => d("nope"), /Invalid date/);
  });
});

describe("addDays", () => {
  it("crosses month, year and leap day", () => {
    assert.equal(f(addDays(d("2026-10-31"), 1)), "2026-11-01");
    assert.equal(f(addDays(d("2026-12-31"), 1)), "2027-01-01");
    assert.equal(f(addDays(d("2028-02-28"), 1)), "2028-02-29");
  });

  it("goes backwards", () => {
    assert.equal(f(addDays(d("2026-10-03"), -5)), "2026-09-28");
  });

  it("does not change the input", () => {
    const input = d("2026-10-05");
    addDays(input, 10);
    assert.equal(f(input), "2026-10-05");
  });
});

describe("addMonths", () => {
  it("clamps to the month end (spec vectors)", () => {
    assert.equal(f(addMonths(d("2026-01-31"), 1)), "2026-02-28");
    assert.equal(f(addMonths(d("2027-08-31"), 6)), "2028-02-29");
  });

  it("keeps the same day when it exists", () => {
    assert.equal(f(addMonths(d("2026-10-08"), 3)), "2027-01-08");
    assert.equal(f(addMonths(d("2026-10-05"), 12)), "2027-10-05");
  });

  it("handles year wrap and leap-day clamping", () => {
    assert.equal(f(addMonths(d("2026-11-15"), 3)), "2027-02-15");
    assert.equal(f(addMonths(d("2026-11-30"), 3)), "2027-02-28");
    assert.equal(f(addMonths(d("2028-02-29"), 12)), "2029-02-28");
  });

  it("handles negative months", () => {
    assert.equal(f(addMonths(d("2026-03-31"), -1)), "2026-02-28");
    assert.equal(f(addMonths(d("2026-01-15"), -2)), "2025-11-15");
  });

  it("does not change the input", () => {
    const input = d("2026-01-31");
    addMonths(input, 1);
    assert.equal(f(input), "2026-01-31");
  });
});

describe("diffDays (a minus b)", () => {
  it("counts whole calendar days", () => {
    assert.equal(diffDays(d("2026-10-08"), d("2026-10-05")), 3);
    assert.equal(diffDays(d("2026-10-05"), d("2026-10-08")), -3);
    assert.equal(diffDays(d("2026-10-05"), d("2026-10-05")), 0);
    assert.equal(diffDays(d("2028-03-01"), d("2028-02-28")), 2);
  });
});

describe("startOfMonth", () => {
  it("returns the first day at UTC midnight", () => {
    assert.equal(startOfMonth(d("2026-10-17")).toISOString(), "2026-10-01T00:00:00.000Z");
  });
});