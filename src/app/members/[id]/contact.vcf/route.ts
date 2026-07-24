import { generateVCard, safeDownloadName } from "@/lib/downloads";
import { getMembers } from "@/services/jotform/data.server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const result = await getMembers();
  if (result.error) {
    return new Response("Contact file is temporarily unavailable.", {
      status: 503,
    });
  }
  const member = result.data.find((item) => item.id === id);
  if (!member) return new Response("Member not found.", { status: 404 });

  const filename = `${safeDownloadName(
    member.fullName,
    member.businessName,
  )}.vcf`;
  return new Response(generateVCard(member), {
    headers: {
      "Content-Type": "text/vcard; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
    },
  });
}
