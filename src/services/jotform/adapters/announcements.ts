import "server-only";

import type {
  Announcement,
  AnnouncementImportance,
} from "@/lib/types";
import type { RawJotformSubmission } from "../raw-types";
import {
  type AdaptationResult,
  answer,
  dateValue,
  safeUrl,
  stablePublicId,
  textValue,
} from "./values";

export function adaptAnnouncementSubmission(
  submission: RawJotformSubmission,
): Announcement | null {
  return inspectAnnouncementSubmission(submission).record;
}

export function inspectAnnouncementSubmission(
  submission: RawJotformSubmission,
): AdaptationResult<Announcement> {
  const title = textValue(answer(submission, "2"));
  const message = textValue(answer(submission, "3"));
  const publishDate = dateValue(answer(submission, "5"));
  const expirationDate = dateValue(answer(submission, "6"));
  const dateParsed = Boolean(publishDate && expirationDate);
  if (!title || !message) {
    return {
      record: null,
      rejectionCategory: "missing_required_field",
      dateParsed,
    };
  }
  if (!dateParsed) {
    return {
      record: null,
      rejectionCategory: "invalid_date",
      dateParsed: false,
    };
  }
  if (publishDate > expirationDate) {
    return {
      record: null,
      rejectionCategory: "invalid_date_range",
      dateParsed: true,
    };
  }

  const importance = parseImportance(textValue(answer(submission, "4")));
  return {
    record: {
      id: stablePublicId("announcement", title, publishDate),
      title,
      message,
      importance,
      publishDate,
      expirationDate,
      image: safeUrl(answer(submission, "7")),
      buttonText: textValue(answer(submission, "8")) || undefined,
      buttonLink: safeUrl(answer(submission, "9")),
      showPopup: importance === "urgent",
    },
    dateParsed: true,
  };
}

function parseImportance(value: string): AnnouncementImportance {
  const normalized = value.toLowerCase();
  if (normalized === "urgent") return "urgent";
  if (normalized === "important") return "important";
  return "normal";
}
