const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { normalizePhone, maskPhone } = require("../../src/utils/phone");
const { SEED_CUSTOMERS } = require("../../src/utils/seedData");

const isInvalidPhoneError = (error) =>
  error.statusCode === 400 && error.message === "Enter a valid phone number";

describe("normalizePhone", () => {
  it("normalizes Bangladeshi formats to +8801XXXXXXXXX", () => {
    const expected = "+8801712345678";
    for (const input of [
      "01712345678", // spec vector
      "+880 1712-345678", // spec vector
      "+8801712345678",
      "8801712345678",
      "008801712345678",
      "1712345678",
      "(017) 1234-5678",
      "017.1234.5678",
      "  01712345678  ",
    ]) {
      assert.equal(normalizePhone(input), expected, input);
    }
  });

  it("keeps valid international numbers", () => {
    assert.equal(normalizePhone("+1 (415) 555-2671"), "+14155552671");
    assert.equal(normalizePhone("0014155552671"), "+14155552671");
  });

  it("rejects invalid input with a 400", () => {
    for (const input of [
      "",
      "abc",
      "123",
      "01212345678", // second digit 2 is not a Bangladeshi mobile prefix
      "+0123456789",
      "+88017123456789012",
      "0171234567", // too short
      12345678901,
      null,
      undefined,
    ]) {
      assert.throws(() => normalizePhone(input), isInvalidPhoneError, String(input));
    }
  });

  it("leaves every seed phone unchanged", () => {
    for (const customer of SEED_CUSTOMERS) {
      assert.equal(normalizePhone(customer.phone), customer.phone);
    }
  });
});

describe("maskPhone", () => {
  it("keeps only the last 4 digits", () => {
    assert.equal(maskPhone("+8801712345678"), "***5678");
  });

  it("returns an empty string for empty input", () => {
    assert.equal(maskPhone(""), "");
    assert.equal(maskPhone(null), "");
  });
});