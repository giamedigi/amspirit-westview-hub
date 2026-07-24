import "server-only";

import { getPublicEventImageSource } from "./data.server";
import { getJotformApiKey } from "./env.server";
import { proxyPublicEventImage } from "./event-image-proxy";

export async function servePublicEventImage(
  eventId: string,
  imageTypeValue: string,
): Promise<Response> {
  return proxyPublicEventImage(eventId, imageTypeValue, {
    apiKey: getJotformApiKey(),
    fetchImpl: fetch,
    lookup: getPublicEventImageSource,
  });
}
