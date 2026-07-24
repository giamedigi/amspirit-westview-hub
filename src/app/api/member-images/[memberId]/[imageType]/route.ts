import { servePublicMemberImage } from "@/services/jotform/member-image-proxy.server";

export async function GET(
  _request: Request,
  {
    params,
  }: {
    params: Promise<{ memberId: string; imageType: string }>;
  },
) {
  const { memberId, imageType } = await params;
  return servePublicMemberImage(memberId, imageType);
}
