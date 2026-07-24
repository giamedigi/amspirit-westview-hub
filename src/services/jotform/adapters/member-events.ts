import "server-only";

import type { MemberEvent } from "@/lib/types";
import type { RawJotformSubmission } from "../raw-types";
import {
  addressValue,
  type AdaptationResult,
  answer,
  dateValue,
  safeUrl,
  stablePublicId,
  textValue,
  timeValue,
} from "./values";

export function adaptMemberEventSubmission(
  submission: RawJotformSubmission,
): MemberEvent | null {
  return inspectMemberEventSubmission(submission).record;
}

export function inspectMemberEventSubmission(
  submission: RawJotformSubmission,
): AdaptationResult<MemberEvent> {
  const title = textValue(answer(submission, "39"));
  const date = dateValue(answer(submission, "42"));
  if (!title) {
    return {
      record: null,
      rejectionCategory: "missing_required_field",
      dateParsed: Boolean(date),
    };
  }
  if (!date) {
    return {
      record: null,
      rejectionCategory: "invalid_date",
      dateParsed: false,
    };
  }

  const venue = textValue(answer(submission, "48"));
  const address = addressValue(answer(submission, "49"));
  const location = [venue, address].filter(Boolean).join(" — ");
  const eventType = textValue(answer(submission, "41"));
  const startTime = timeValue(answer(submission, "43"));
  const endTime = timeValue(answer(submission, "44"));

  return {
    record: {
      id: stablePublicId("event", title, date, startTime),
      title,
      date,
      startTime,
      endTime,
      location: location || textValue(answer(submission, "47")) || undefined,
      venue: venue || undefined,
      address: address || undefined,
      description: textValue(answer(submission, "40")),
      eventType: eventType || undefined,
      recurring: textValue(answer(submission, "45")) || undefined,
      recurrenceDetails: textValue(answer(submission, "46")) || undefined,
      eventFormat: textValue(answer(submission, "47")) || undefined,
      virtualLink: safeUrl(answer(submission, "50")),
      openToPublic: textValue(answer(submission, "51")) || undefined,
      registrationRequired:
        textValue(answer(submission, "52")) || undefined,
      registrationLink: safeUrl(answer(submission, "53")),
      cost: textValue(answer(submission, "54")) || undefined,
      registrationDeadline:
        dateValue(answer(submission, "55")) ||
        textValue(answer(submission, "55")) ||
        undefined,
      targetAudience: textValue(answer(submission, "56")) || undefined,
      flyer: safeUrl(answer(submission, "57")),
      socialGraphic: safeUrl(answer(submission, "58")),
      type: eventType.toLowerCase().includes("community")
        ? "community"
        : "member",
    },
    dateParsed: true,
  };
}
