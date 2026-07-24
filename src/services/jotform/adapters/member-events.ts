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
  const eventType = textValue(answer(submission, "41")).toLowerCase();
  const startTime = timeValue(answer(submission, "43"));
  const endTime = timeValue(answer(submission, "44"));

  return {
    record: {
      id: stablePublicId("event", title, date, startTime),
      title,
      date,
      startTime: startTime || "Time not listed",
      endTime: endTime || "Time not listed",
      location: location || textValue(answer(submission, "47")) || undefined,
      description: textValue(answer(submission, "40")),
      registrationLink:
        safeUrl(answer(submission, "53")) ??
        safeUrl(answer(submission, "50")),
      image:
        safeUrl(answer(submission, "57")) ??
        safeUrl(answer(submission, "58")),
      type: eventType.includes("community") ? "community" : "member",
    },
    dateParsed: true,
  };
}
