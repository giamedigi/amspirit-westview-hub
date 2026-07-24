import { isEventImageType, type EventImageType } from "./event-images.ts";
import {
  proxyPublicImage,
  type PublicImageProxyDependencies,
} from "./public-image-proxy.ts";

const EVENT_ID_PATTERN = /^event-[a-f0-9]{16}$/;

export type EventImageProxyDependencies =
  PublicImageProxyDependencies<EventImageType>;

export async function proxyPublicEventImage(
  eventId: string,
  imageTypeValue: string,
  dependencies: EventImageProxyDependencies,
): Promise<Response> {
  return proxyPublicImage(
    eventId,
    imageTypeValue,
    {
      publicIdPattern: EVENT_ID_PATTERN,
      isImageType: isEventImageType,
    },
    dependencies,
  );
}
