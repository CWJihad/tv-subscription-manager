const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { getFirstName, formatMessageDate, renderTemplate } = require("../../src/utils/template");
const { maskEmail } = require("../../src/utils/mask");
const { parseDateOnly: d } = require("../../src/utils/dates");
const { DEFAULT_REMINDER_TEMPLATES } = require("../../src/config/business");

describe("getFirstName", () => {
  it("returns the first word", () => {
    assert.equal(getFirstName("John Smith"), "John");
    assert.equal(getFirstName("  Sarah   Khan "), "Sarah");
    assert.equal(getFirstName("Madonna"), "Madonna");
  });

  it("returns an empty string for empty input", () => {
    assert.equal(getFirstName(""), "");
    assert.equal(getFirstName("   "), "");
    assert.equal(getFirstName(null), "");
    assert.equal(getFirstName(undefined), "");
  });
});

describe("formatMessageDate", () => {
  it("formats as 'Oct 8, 2026'", () => {
    assert.equal(formatMessageDate(d("2026-10-08")), "Oct 8, 2026");
    assert.equal(formatMessageDate(d("2027-01-05")), "Jan 5, 2027");
    assert.equal(formatMessageDate(d("2026-12-31")), "Dec 31, 2026");
  });
});

describe("renderTemplate", () => {
  it("fills {firstName} and {date}, including repeats", () => {
    assert.equal(
      renderTemplate("Hi {firstName}, {date}. Bye {firstName}.", { firstName: "John", date: "Oct 8, 2026" }),
      "Hi John, Oct 8, 2026. Bye John."
    );
  });

  it("keeps '$' in names literal", () => {
    assert.equal(renderTemplate("Hi {firstName}", { firstName: "$&", date: "x" }), "Hi $&");
  });

  it("leaves unknown placeholders untouched", () => {
    assert.equal(renderTemplate("Hi {nickname}", { firstName: "John", date: "x" }), "Hi {nickname}");
  });

  it("renders the default templates", () => {
    const values = { firstName: "John", date: "Oct 8, 2026" };
    assert.equal(
      renderTemplate(DEFAULT_REMINDER_TEMPLATES.d7, values),
      "Hi John, your TV subscription expires on Oct 8, 2026 (7 days left). Please renew to keep your service running. Thank you!"
    );
    assert.equal(
      renderTemplate(DEFAULT_REMINDER_TEMPLATES.expired, values),
      "Hi John, your TV subscription expired on Oct 8, 2026. Please renew to get your service back. Thank you!"
    );
  });

  it("leaves no placeholders in any default template", () => {
    for (const [key, text] of Object.entries(DEFAULT_REMINDER_TEMPLATES)) {
      const rendered = renderTemplate(text, { firstName: "A", date: "B" });
      assert.doesNotMatch(rendered, /\{[^}]*\}/, key);
    }
  });
});

describe("maskEmail", () => {
  it("keeps the first letter and the domain", () => {
    assert.equal(maskEmail("john@email.com"), "j***@email.com");
  });

  it("returns an empty string for invalid input", () => {
    assert.equal(maskEmail(""), "");
    assert.equal(maskEmail(null), "");
    assert.equal(maskEmail("not-an-email"), "");
  });
});