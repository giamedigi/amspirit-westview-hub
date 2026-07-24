import {
  proxyPublicImage,
  validateApprovedRedirect,
  validateJotformUploadUrl,
  type PublicImageProxyDependencies,
} from "./public-image-proxy.ts";

type MemberImageType = "headshot" | "business-card";

const MEMBER_ID_PATTERN = /^member-[a-f0-9]{16}$/;

export type ProxyDependencies =
  PublicImageProxyDependencies<MemberImageType>;

export async function proxyPublicMemberImage(
  memberId: string,
  imageTypeValue: string,
  dependencies: ProxyDependencies,
): Promise<Response> {
  return proxyPublicImage(
    memberId,
    imageTypeValue,
    {
      publicIdPattern: MEMBER_ID_PATTERN,
      isImageType: isMemberImageType,
    },
    dependencies,
  );
}

function isMemberImageType(value: string): value is MemberImageType {
  return value === "headshot" || value === "business-card";
}

export { validateApprovedRedirect, validateJotformUploadUrl };
