import type { MemberEvent } from "@/lib/types";
export { formatEventTime } from "@/lib/sharing";

export function eventMapsUrl(event: MemberEvent): string | undefined {
  const destination =
    [event.venue, event.address].filter(Boolean).join(", ") || event.location;
  if (!destination) return undefined;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(destination)}`;
}
