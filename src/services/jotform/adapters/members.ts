import "server-only";

import type { Member } from "@/lib/types";
import type { RawJotformSubmission } from "../raw-types";
import {
  answer,
  fullNameValue,
  phoneValue,
  safeUrl,
  stablePublicId,
  textValue,
} from "./values";

export function adaptMemberSubmission(
  submission: RawJotformSubmission,
): Member | null {
  const fullName = fullNameValue(answer(submission, "2"));
  const businessName = textValue(answer(submission, "3"));
  if (!fullName || !businessName) return null;

  const profession = textValue(answer(submission, "4"));
  const permission = textValue(answer(submission, "12")).toLowerCase();
  const mayDisplayContact = permission === "yes, i give permission";

  return {
    id: stablePublicId("member", fullName, businessName),
    fullName,
    businessName,
    profession: profession || "Business professional",
    category: profession || "Business",
    phone: mayDisplayContact
      ? phoneValue(answer(submission, "5")) || undefined
      : undefined,
    email: mayDisplayContact
      ? textValue(answer(submission, "6")) || undefined
      : undefined,
    website: safeUrl(answer(submission, "7")),
    description: textValue(answer(submission, "8")),
    idealReferral: textValue(answer(submission, "9")),
    headshot: safeUrl(answer(submission, "10")),
    businessCardImage: safeUrl(answer(submission, "11")),
    permissions: {
      phone: mayDisplayContact,
      email: mayDisplayContact,
    },
  };
}
