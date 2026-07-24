import type { MemberEvent } from "@/lib/types";

export function formatEventTime(
  startTime?: string,
  endTime?: string,
): string {
  const start = listedTime(startTime);
  const end = listedTime(endTime);
  if (start && end) return `${start} to ${end}`;
  return start || end || "Time not listed";
}

export function eventMapsUrl(event: MemberEvent): string | undefined {
  const destination =
    [event.venue, event.address].filter(Boolean).join(", ") || event.location;
  if (!destination) return undefined;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(destination)}`;
}

function listedTime(value?: string): string {
  const trimmed = value?.trim() ?? "";
  return trimmed.toLowerCase() === "time not listed" ? "" : trimmed;
}
