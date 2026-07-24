export const EVENT_IMAGE_TYPES = ["flyer", "social-graphic"] as const;
export type EventImageType = (typeof EVENT_IMAGE_TYPES)[number];

export function isEventImageType(value: string): value is EventImageType {
  return EVENT_IMAGE_TYPES.includes(value as EventImageType);
}

export function eventImagePath(
  eventId: string,
  imageType: EventImageType,
): string {
  return `/api/event-images/${encodeURIComponent(eventId)}/${imageType}`;
}
