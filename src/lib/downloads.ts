import type { Member, MemberEvent } from "./types";

const CRLF = "\r\n";
const TIMEZONE = "America/New_York";

export function generateVCard(member: Member): string {
  const lines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `FN:${escapeVCard(member.fullName)}`,
    `N:${escapeVCardName(member.fullName)}`,
  ];
  if (member.businessName) lines.push(`ORG:${escapeVCard(member.businessName)}`);
  if (member.profession) lines.push(`TITLE:${escapeVCard(member.profession)}`);
  if (member.permissions.phone && member.phone) {
    lines.push(`TEL;TYPE=WORK,VOICE:${escapeVCard(member.phone)}`);
  }
  if (member.permissions.email && member.email) {
    lines.push(`EMAIL;TYPE=INTERNET,WORK:${escapeVCard(member.email)}`);
  }
  if (member.website) lines.push(`URL:${escapeVCard(member.website)}`);
  const note = ["AM Spirit West View Chapter", member.description]
    .filter(Boolean)
    .join("\n");
  lines.push(`NOTE:${escapeVCard(note)}`, "END:VCARD");
  return `${lines.join(CRLF)}${CRLF}`;
}

export function generateCalendarFile(
  event: MemberEvent,
  publicUrl: string,
  now = new Date(),
): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//AM Spirit West View//Chapter Hub//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
  ];
  const start = parseTime(event.startTime);
  const end = parseTime(event.endTime);
  const dateLines: string[] = [];
  if (start === null) {
    dateLines.push(
      `DTSTART;VALUE=DATE:${compactDate(event.date)}`,
      `DTEND;VALUE=DATE:${compactDate(addDays(event.date, 1))}`,
    );
  } else {
    lines.push(...timeZoneDefinition());
    const endMinutes = end !== null && end > start ? end : start + 60;
    dateLines.push(
      `DTSTART;TZID=${TIMEZONE}:${localDateTime(event.date, start)}`,
      `DTEND;TZID=${TIMEZONE}:${localDateTime(event.date, endMinutes)}`,
    );
  }

  const location = [event.venue, event.address].filter(Boolean).join(", ");
  const description = [
    event.description,
    event.registrationLink
      ? `Registration: ${event.registrationLink}`
      : undefined,
    event.virtualLink ? `Virtual event: ${event.virtualLink}` : undefined,
    `Event details: ${publicUrl}`,
  ]
    .filter(Boolean)
    .join("\n\n");

  lines.push(
    "BEGIN:VEVENT",
    `UID:${escapeIcs(`${event.id}@amspirit-westview-hub`)}`,
    `DTSTAMP:${formatUtc(now)}`,
    `SUMMARY:${escapeIcs(event.title)}`,
    ...dateLines,
  );
  if (location || event.location) {
    lines.push(`LOCATION:${escapeIcs(location || event.location || "")}`);
  }
  if (description) lines.push(`DESCRIPTION:${escapeIcs(description)}`);
  lines.push(
    `URL:${escapeIcs(publicUrl)}`,
    "STATUS:CONFIRMED",
    "TRANSP:OPAQUE",
    "END:VEVENT",
    "END:VCALENDAR",
  );
  return `${lines.join(CRLF)}${CRLF}`;
}

export function safeDownloadName(...parts: string[]): string {
  const value = parts
    .filter(Boolean)
    .join("-")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return value || "download";
}

export function escapeVCard(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\r\n|\r|\n/g, "\\n")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,");
}

export function escapeIcs(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\r\n|\r|\n/g, "\\n")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,");
}

function escapeVCardName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  const last = parts.length > 1 ? parts.pop() || "" : "";
  const first = parts.join(" ") || fullName;
  return `${escapeVCard(last)};${escapeVCard(first)};;;`;
}

function parseTime(value?: string): number | null {
  if (!value || value.toLowerCase() === "time not listed") return null;
  const match = value
    .trim()
    .match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?$/i);
  if (!match) return null;
  let hour = Number(match[1]);
  const minute = Number(match[2] || 0);
  const period = match[3]?.toUpperCase();
  if (minute > 59 || hour > (period ? 12 : 23) || hour < 0) return null;
  if (period) {
    if (hour === 12) hour = 0;
    if (period === "PM") hour += 12;
  }
  return hour * 60 + minute;
}

function compactDate(value: string): string {
  return value.replaceAll("-", "");
}

function addDays(value: string, days: number): string {
  const date = new Date(`${value}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function localDateTime(date: string, minutes: number): string {
  const base = new Date(`${date}T00:00:00Z`);
  base.setUTCMinutes(minutes);
  return `${compactDate(base.toISOString().slice(0, 10))}T${String(base.getUTCHours()).padStart(2, "0")}${String(base.getUTCMinutes()).padStart(2, "0")}00`;
}

function formatUtc(value: Date): string {
  return value
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}Z$/, "Z");
}

function timeZoneDefinition(): string[] {
  return [
    "BEGIN:VTIMEZONE",
    `TZID:${TIMEZONE}`,
    `X-LIC-LOCATION:${TIMEZONE}`,
    "BEGIN:DAYLIGHT",
    "TZOFFSETFROM:-0500",
    "TZOFFSETTO:-0400",
    "TZNAME:EDT",
    "DTSTART:19700308T020000",
    "RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=2SU",
    "END:DAYLIGHT",
    "BEGIN:STANDARD",
    "TZOFFSETFROM:-0400",
    "TZOFFSETTO:-0500",
    "TZNAME:EST",
    "DTSTART:19701101T020000",
    "RRULE:FREQ=YEARLY;BYMONTH=11;BYDAY=1SU",
    "END:STANDARD",
    "END:VTIMEZONE",
  ];
}
