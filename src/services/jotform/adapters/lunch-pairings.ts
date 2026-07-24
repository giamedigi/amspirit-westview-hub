import "server-only";

import type { LunchMonth } from "@/lib/types";
import type { RawJotformSubmission } from "../raw-types";
import {
  type AdaptationResult,
  answer,
  stablePublicId,
  textValue,
} from "./values";

const GROUP_QUESTION_IDS = Array.from({ length: 15 }, (_, index) => {
  const first = 4 + index * 4;
  return [String(first), String(first + 1), String(first + 2)];
});

export function adaptLunchPairingSubmission(
  submission: RawJotformSubmission,
): LunchMonth | null {
  return inspectLunchPairingSubmission(submission).record;
}

export function inspectLunchPairingSubmission(
  submission: RawJotformSubmission,
): AdaptationResult<LunchMonth> {
  const monthYear = parseMonthYear(textValue(answer(submission, "2")));
  if (!monthYear) {
    return {
      record: null,
      rejectionCategory: "invalid_month_year",
      dateParsed: false,
    };
  }

  const groups = GROUP_QUESTION_IDS.map((questionIds, index) => {
    const members = questionIds
      .map((questionId) => textValue(answer(submission, questionId)))
      .filter(Boolean);
    return {
      id: `${stablePublicId("lunch", String(monthYear.year), String(monthYear.month))}-group-${index + 1}`,
      members,
    };
  }).filter((group) => group.members.length > 0);

  if (!groups.length) {
    return {
      record: null,
      rejectionCategory: "empty_groups",
      dateParsed: true,
    };
  }
  return { record: { ...monthYear, groups }, dateParsed: true };
}

function parseMonthYear(value: string): Pick<LunchMonth, "month" | "year"> | null {
  const normalized = value.trim();
  const numeric = normalized.match(/\b(20\d{2})[-/](0?[1-9]|1[0-2])\b/);
  if (numeric) return { year: Number(numeric[1]), month: Number(numeric[2]) };

  const parsed = new Date(`1 ${normalized}`);
  if (Number.isNaN(parsed.getTime())) return null;
  return { month: parsed.getMonth() + 1, year: parsed.getFullYear() };
}
