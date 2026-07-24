export const MEMBER_IMAGE_TYPES = ["headshot", "business-card"] as const;
export type MemberImageType = (typeof MEMBER_IMAGE_TYPES)[number];

export function isMemberImageType(value: string): value is MemberImageType {
  return MEMBER_IMAGE_TYPES.includes(value as MemberImageType);
}

export function memberImagePath(
  memberId: string,
  imageType: MemberImageType,
): string {
  return `/api/member-images/${encodeURIComponent(memberId)}/${imageType}`;
}
