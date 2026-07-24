import "server-only";

import { getJotformApiKey } from "./env.server";
import { getPublicMemberImageSource } from "./data.server";
import { proxyPublicMemberImage } from "./member-image-proxy";

export async function servePublicMemberImage(
  memberId: string,
  imageTypeValue: string,
): Promise<Response> {
  return proxyPublicMemberImage(memberId, imageTypeValue, {
    apiKey: getJotformApiKey(),
    fetchImpl: fetch,
    lookup: getPublicMemberImageSource,
  });
}
