import "server-only";

import type {
  Announcement,
  AnnouncementImportance,
} from "@/lib/types";
import type { RawJotformSubmission } from "../raw-types";
import {
  answer,
  dateValue,
  safeUrl,
  stablePublicId,
  textValue,
} from "./values";

export function adaptAnnouncementSubmission(
  submission: RawJotformSubmission,
): Announcement | null {
  const title = textValue(answer(submission, "2"));
  const message = textValue(answer(submission, "3"));
  const publishDate = dateValue(answer(submission, "5"));
  const expirationDate = dateValue(answer(submission, "6"));
  if (!title || !message || !publishDate || !expirationDate) return null;

  const importance = parseImportance(textValue(answer(submission, "4")));
  return {
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
  };
}

function parseImportance(value: string): AnnouncementImportance {
  const normalized = value.toLowerCase();
  if (normalized === "urgent") return "urgent";
  if (normalized === "important") return "important";
  return "normal";
}
