import assert from "node:assert/strict";
import test from "node:test";
import {
  buildEventShareMessage,
  buildMemberShareMessage,
} from "../src/lib/sharing.ts";
import {
  generateCalendarFile,
  generateVCard,
  safeDownloadName,
} from "../src/lib/downloads.ts";

const member = (overrides = {}) => ({
  id: "member-safe",
  fullName: "Jane Smith",
  businessName: "Smith Insurance",
  profession: "Insurance Agent",
  category: "Insurance",
  phone: "412-555-1234",
  email: "jane@example.com",
  website: "https://smithinsurance.com/",
  description: "Helping families with home, auto, and business coverage.",
  idealReferral: "Homeowners",
  permissions: { phone: true, email: true },
  ...overrides,
});

const event = (overrides = {}) => ({
  id: "event-safe",
  title: "Community Workshop",
  date: "2026-09-10",
  startTime: "5:30 PM",
  endTime: "7:00 PM",
  venue: "West View Hall",
  address: "1 Main St, Pittsburgh, PA",
  location: "West View Hall — 1 Main St, Pittsburgh, PA",
  description: "Learn, connect; grow\\together.\nBring questions.",
  registrationLink: "https://example.com/register",
  virtualLink: "https://example.com/join",
  type: "community",
  ...overrides,
});

test("member sharing includes all approved public fields", () => {
  assert.equal(
    buildMemberShareMessage(member()),
    [
      "Check out Jane Smith with Smith Insurance",
      "Helping families with home, auto, and business coverage.",
      "Phone: 412-555-1234",
      "Email: jane@example.com",
      "Website: smithinsurance.com",
    ].join("\n"),
  );
});

test("member sharing falls back to profession and omits missing lines", () => {
  const text = buildMemberShareMessage(
    member({
      businessName: "",
      description: "",
      phone: undefined,
      email: undefined,
      website: undefined,
    }),
  );
  assert.equal(text, "Check out Jane Smith with Insurance Agent");
  assert.doesNotMatch(text, /Phone:|Email:|Website:/);
});

test("member sharing honors public contact permissions", () => {
  const text = buildMemberShareMessage(
    member({ permissions: { phone: false, email: false } }),
  );
  assert.doesNotMatch(text, /412-555-1234|jane@example.com/);
});

test("copy fallback uses the same member referral formatting", () => {
  const expected = buildMemberShareMessage(member());
  assert.equal(buildMemberShareMessage(member()), expected);
  assert.doesNotMatch(expected, /amspirit|jotform|\/members\//i);
});

test("vCard escapes special characters and uses CRLF", () => {
  const value = generateVCard(
    member({
      fullName: "Jane Doe, Jr.",
      businessName: "Acme; Partners",
      description: "Line one\nLine two, continued",
    }),
  );
  assert.match(value, /FN:Jane Doe\\, Jr\.\r\n/);
  assert.match(value, /ORG:Acme\\; Partners\r\n/);
  assert.match(value, /Line one\\nLine two\\, continued/);
  assert.ok(value.endsWith("END:VCARD\r\n"));
  assert.doesNotMatch(value.replaceAll("\r\n", ""), /\n/);
});

test("vCard omits unavailable optional fields and creates safe filenames", () => {
  const value = generateVCard(
    member({
      phone: undefined,
      email: undefined,
      website: undefined,
      description: "",
    }),
  );
  assert.doesNotMatch(value, /TEL|EMAIL|URL/);
  assert.equal(
    safeDownloadName("Jane Doe\r\nInjected", "Acme & Co."),
    "jane-doe-injected-acme-co",
  );
});

test("event sharing includes a public details URL and all-day label", () => {
  const text = buildEventShareMessage(
    event({ startTime: "", endTime: "" }),
    "https://hub.example/events/event-safe",
  );
  assert.match(text, /^Community Workshop\nThursday, September 10, 2026\nAll day/m);
  assert.match(text, /https:\/\/hub\.example\/events\/event-safe$/);
});

test("ICS creates a date-only all-day event", () => {
  const value = generateCalendarFile(
    event({ startTime: "", endTime: "" }),
    "https://hub.example/events/event-safe",
    new Date("2026-01-02T03:04:05Z"),
  );
  assert.match(value, /DTSTART;VALUE=DATE:20260910\r\n/);
  assert.match(value, /DTEND;VALUE=DATE:20260911\r\n/);
  assert.doesNotMatch(value, /DTSTART;TZID/);
});

test("ICS gives a start-only event a 60-minute duration", () => {
  const value = generateCalendarFile(
    event({ startTime: "5:30 PM", endTime: "" }),
    "https://hub.example/events/event-safe",
  );
  assert.match(value, /DTSTART;TZID=America\/New_York:20260910T173000/);
  assert.match(value, /DTEND;TZID=America\/New_York:20260910T183000/);
});

test("ICS preserves a valid submitted time range", () => {
  const value = generateCalendarFile(
    event(),
    "https://hub.example/events/event-safe",
  );
  assert.match(value, /DTSTART;TZID=America\/New_York:20260910T173000/);
  assert.match(value, /DTEND;TZID=America\/New_York:20260910T190000/);
  assert.match(value, /BEGIN:VTIMEZONE/);
});

test("ICS escapes location and description and includes public links", () => {
  const value = generateCalendarFile(
    event(),
    "https://hub.example/events/event-safe",
  );
  assert.match(value, /LOCATION:West View Hall\\, 1 Main St\\, Pittsburgh\\, PA/);
  assert.match(value, /Learn\\, connect\\; grow\\\\together\.\\nBring questions\./);
  assert.match(value, /Registration: https:\/\/example\.com\/register/);
  assert.match(value, /Virtual event: https:\/\/example\.com\/join/);
  assert.match(value, /UID:event-safe@amspirit-westview-hub/);
  assert.ok(value.endsWith("END:VCALENDAR\r\n"));
});
