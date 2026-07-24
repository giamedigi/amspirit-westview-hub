import "server-only";

import type { Member } from "@/lib/types";
import type { RawJotformSubmission } from "../raw-types";
import {
  type AdaptationResult,
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
  return inspectMemberSubmission(submission).record;
}

export function inspectMemberSubmission(
  submission: RawJotformSubmission,
): AdaptationResult<Member> {
  const fullName = fullNameValue(answer(submission, "2"));
  const businessName = textValue(answer(submission, "3"));
  if (!fullName) {
    return {
      record: null,
      rejectionCategory: "missing_required_field",
      dateParsed: null,
    };
  }

  const profession = textValue(answer(submission, "4"));
  const permission = textValue(answer(submission, "12")).toLowerCase();
  const mayDisplayContact = permission === "yes, i give permission";

  return {
    record: {
      id: stablePublicId(
        "member",
        fullName,
        businessName || profession || "business",
      ),
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
    },
    dateParsed: null,
  };
}
