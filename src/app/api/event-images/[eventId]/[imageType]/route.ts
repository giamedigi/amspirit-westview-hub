import { servePublicEventImage } from "@/services/jotform/event-image-proxy.server";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: {
    params: Promise<{ eventId: string; imageType: string }>;
  },
): Promise<Response> {
  const { eventId, imageType } = await context.params;
  return servePublicEventImage(eventId, imageType);
}
