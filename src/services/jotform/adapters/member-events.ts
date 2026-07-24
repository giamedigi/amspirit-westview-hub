import "server-only";

import type { MemberEvent } from "@/lib/types";
import type { RawJotformSubmission } from "../raw-types";
import {
  addressValue,
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
  const title = textValue(answer(submission, "39"));
  const date = dateValue(answer(submission, "42"));
  if (!title || !date) return null;

  const venue = textValue(answer(submission, "48"));
  const address = addressValue(answer(submission, "49"));
  const location = [venue, address].filter(Boolean).join(" — ");
  const eventType = textValue(answer(submission, "41")).toLowerCase();

  return {
    id: stablePublicId("event", title, date, timeValue(answer(submission, "43"))),
    title,
    date,
    startTime: timeValue(answer(submission, "43")) || "Time not listed",
    endTime: timeValue(answer(submission, "44")) || "Time not listed",
    location: location || textValue(answer(submission, "47")) || undefined,
    description: textValue(answer(submission, "40")),
    registrationLink:
      safeUrl(answer(submission, "53")) ??
      safeUrl(answer(submission, "50")),
    image:
      safeUrl(answer(submission, "57")) ??
      safeUrl(answer(submission, "58")),
    type: eventType.includes("community") ? "community" : "member",
  };
}
