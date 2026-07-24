import type { Member, MemberEvent } from "./types";

export function formatEventTime(
  startTime?: string,
  endTime?: string,
): string {
  const start = listedTime(startTime);
  const end = listedTime(endTime);
  if (start && end) return `${start} to ${end}`;
  return start || end || "Time not listed";
}

export function buildMemberShareMessage(member: Member): string {
  const organization = member.businessName || member.profession;
  const lines = [
    organization
      ? `Check out ${member.fullName} with ${organization}`
      : `Check out ${member.fullName}`,
  ];
  if (member.description) lines.push(member.description);
  if (member.permissions.phone && member.phone) {
    lines.push(`Phone: ${member.phone}`);
  }
  if (member.permissions.email && member.email) {
    lines.push(`Email: ${member.email}`);
  }
  if (member.website) lines.push(`Website: ${displayUrl(member.website)}`);
  return lines.join("\n");
}

export function buildEventShareMessage(
  event: MemberEvent,
  publicUrl: string,
): string {
  const time = formatEventTime(event.startTime, event.endTime);
  return [
    event.title,
    formatEventDate(event.date),
    time === "Time not listed" ? "All day" : time,
    event.venue || event.location,
    publicUrl,
  ]
    .filter(Boolean)
    .join("\n");
}

export function formatEventDate(date: string): string {
  return new Date(`${date}T12:00:00`).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function displayUrl(value: string): string {
  try {
    const url = new URL(value);
    return `${url.host}${url.pathname === "/" ? "" : url.pathname}${url.search}`;
  } catch {
    return value;
  }
}

function listedTime(value?: string): string {
  const trimmed = value?.trim() ?? "";
  return trimmed.toLowerCase() === "time not listed" ? "" : trimmed;
}
