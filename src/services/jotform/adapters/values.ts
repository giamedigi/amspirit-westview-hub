import "server-only";

import { createHash } from "node:crypto";
import type {
  JotformAnswerValue,
  RawJotformSubmission,
} from "../raw-types";

export function answer(
  submission: RawJotformSubmission,
  questionId: string,
): JotformAnswerValue | undefined {
  return submission.answers[questionId]?.answer;
}

export function textValue(value: JotformAnswerValue | undefined): string {
  if (typeof value === "string" || typeof value === "number") {
    return String(value).trim();
  }
  if (Array.isArray(value)) {
    return value.map(textValue).filter(Boolean).join(", ");
  }
  if (value && typeof value === "object") {
    const preferredKeys = [
      "full",
      "formatted",
      "value",
      "name",
      "first",
      "middle",
      "last",
    ];
    const preferred = preferredKeys
      .map((key) => textValue(value[key]))
      .filter(Boolean);
    if (preferred.length) return [...new Set(preferred)].join(" ");
    const remaining = Object.values(value).map(textValue).filter(Boolean);
    if (remaining.length) return [...new Set(remaining)].join(" ");
  }
  return "";
}

export function fullNameValue(
  value: JotformAnswerValue | undefined,
): string {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return textValue(value);
  }
  const name = ["prefix", "first", "middle", "last", "suffix"]
    .map((key) => textValue(value[key]))
    .filter(Boolean)
    .join(" ");
  return name || textValue(value);
}

export function phoneValue(
  value: JotformAnswerValue | undefined,
): string {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return textValue(value);
  }
  const country = textValue(value.country);
  const area = textValue(value.area);
  const number =
    textValue(value.phoneNumber) ||
    textValue(value.phone) ||
    textValue(value.number);
  if (area && number) {
    return `${country ? `+${country} ` : ""}(${area}) ${number}`.trim();
  }
  return textValue(value);
}

export function addressValue(
  value: JotformAnswerValue | undefined,
): string {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return textValue(value);
  }
  return [
    value.addr_line1,
    value.addr_line2,
    value.city,
    value.state,
    value.postal,
    value.country,
  ]
    .map(textValue)
    .filter(Boolean)
    .join(", ");
}

export function dateValue(
  value: JotformAnswerValue | undefined,
): string {
  if (typeof value === "string") {
    const match = value.match(/\d{4}-\d{2}-\d{2}/);
    if (match) return match[0];
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime())
      ? ""
      : parsed.toISOString().slice(0, 10);
  }
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const year = textValue(value.year);
    const month = textValue(value.month).padStart(2, "0");
    const day = textValue(value.day).padStart(2, "0");
    if (year && month && day) return `${year}-${month}-${day}`;
  }
  return "";
}

export function timeValue(
  value: JotformAnswerValue | undefined,
): string {
  if (typeof value === "string") return value.trim();
  if (!value || typeof value !== "object" || Array.isArray(value)) return "";
  const hour = textValue(value.hour);
  const minute = (textValue(value.min) || textValue(value.minute)).padStart(
    2,
    "0",
  );
  const ampm = textValue(value.ampm).toUpperCase();
  if (!hour) return "";
  return `${hour}:${minute || "00"}${ampm ? ` ${ampm}` : ""}`;
}

export function safeUrl(
  value: JotformAnswerValue | undefined,
): string | undefined {
  const candidates: string[] = [];
  collectStrings(value, candidates);
  for (const candidate of candidates) {
    const normalized =
      candidate.startsWith("www.") ? `https://${candidate}` : candidate;
    try {
      const url = new URL(normalized);
      if (url.protocol === "https:" || url.protocol === "http:") {
        return url.toString();
      }
    } catch {
      // Ignore malformed optional links.
    }
  }
}

export function stablePublicId(
  kind: string,
  ...publicParts: string[]
): string {
  return `${kind}-${createHash("sha256")
    .update([kind, ...publicParts].join(":"))
    .digest("hex")
    .slice(0, 16)}`;
}

export function submissionTimestamp(
  submission: RawJotformSubmission,
): number {
  const value = submission.updated_at ?? submission.created_at ?? "";
  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function collectStrings(
  value: JotformAnswerValue | undefined,
  output: string[],
): void {
  if (typeof value === "string") {
    output.push(value.trim());
  } else if (Array.isArray(value)) {
    value.forEach((item) => collectStrings(item, output));
  } else if (value && typeof value === "object") {
    Object.values(value).forEach((item) => collectStrings(item, output));
  }
}
