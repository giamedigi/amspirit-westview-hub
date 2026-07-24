import { generateCalendarFile, safeDownloadName } from "@/lib/downloads";
import { getMemberEvents } from "@/services/jotform/data.server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const result = await getMemberEvents();
  if (result.error) {
    return new Response("Calendar file is temporarily unavailable.", {
      status: 503,
    });
  }
  const event = result.data.find((item) => item.id === id);
  if (!event) return new Response("Event not found.", { status: 404 });

  const publicUrl = new URL(`/events/${event.id}`, request.url).toString();
  const filename = `${safeDownloadName(event.title)}.ics`;
  return new Response(generateCalendarFile(event, publicUrl), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
    },
  });
}
