import "server-only";

import { createHash } from "node:crypto";
import type {
  JotformAnswerValue,
  RawJotformAnswer,
  RawJotformSubmission,
} from "../raw-types";

export type RejectionCategory =
  | "empty_groups"
  | "invalid_date"
  | "invalid_date_range"
  | "invalid_month_year"
  | "missing_required_field";

export interface AdaptationResult<T> {
  record: T | null;
  rejectionCategory?: RejectionCategory;
  dateParsed: boolean | null;
}

export function answer(
  submission: RawJotformSubmission,
  questionId: string | number,
): JotformAnswerValue | undefined {
  const raw = rawAnswer(submission, questionId);
  if (!raw) return undefined;
  if (raw.answer !== undefined) return raw.answer;
  if (raw.prettyFormat?.trim()) return raw.prettyFormat.trim();
  const value = raw.value;
  return isAnswerValue(value) ? value : undefined;
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
      "text",
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
    const isoMatch = value.match(/\b(\d{4})-(\d{1,2})-(\d{1,2})\b/);
    if (isoMatch) {
      return validDateParts(isoMatch[1], isoMatch[2], isoMatch[3]);
    }
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime())
      ? ""
      : parsed.toISOString().slice(0, 10);
  }
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const year = textValue(value.year);
    const month = normalizeMonth(textValue(value.month));
    const day = textValue(value.day);
    if (year && month && day) return validDateParts(year, month, day);
    for (const key of ["datetime", "date", "formatted", "value", "text"]) {
      const nested = dateValue(value[key]);
      if (nested) return nested;
    }
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
  return firstSafeUrl(candidates);
}

export function uploadUrl(
  submission: RawJotformSubmission,
  questionId: string | number,
): string | undefined {
  const raw = rawAnswer(submission, questionId);
  if (!raw) return undefined;

  const candidates: string[] = [];
  collectUploadStrings(raw.answer, candidates);
  if (raw.prettyFormat) candidates.push(raw.prettyFormat);
  if (isAnswerValue(raw.value)) collectUploadStrings(raw.value, candidates);

  return firstSafeUrl(candidates);
}

function firstSafeUrl(candidates: string[]): string | undefined {
  for (const candidate of candidates) {
    const decoded = decodeHtml(candidate).trim();
    const href =
      decoded.match(/\bhref\s*=\s*["']([^"']+)["']/i)?.[1] ??
      decoded.match(/\b(?:url|file|link|download(?:Url)?)\s*[:=]\s*["']([^"']+)["']/i)?.[1];
    const possibleUrls = [
      href,
      /^(?:https?:\/\/|www\.)/i.test(decoded) ? decoded : undefined,
      decoded.match(/https?:\/\/[^\s"'<>]+/i)?.[0],
    ];

    for (const possibleUrl of possibleUrls) {
      if (!possibleUrl) continue;
      const normalized = possibleUrl.startsWith("www.")
        ? `https://${possibleUrl}`
        : possibleUrl;
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

function rawAnswer(
  submission: RawJotformSubmission,
  questionId: string | number,
): RawJotformAnswer | undefined {
  const requested = String(questionId);
  const direct = submission.answers[requested];
  if (direct) return direct;

  const numeric = Number(requested);
  if (!Number.isFinite(numeric)) return undefined;
  return Object.entries(submission.answers).find(
    ([key]) => Number(key) === numeric,
  )?.[1];
}

function isAnswerValue(value: unknown): value is JotformAnswerValue {
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return true;
  }
  if (Array.isArray(value)) return value.every(isAnswerValue);
  if (value && typeof value === "object") {
    return Object.values(value).every(isAnswerValue);
  }
  return false;
}

function normalizeMonth(value: string): string {
  const numeric = Number.parseInt(value, 10);
  if (numeric >= 1 && numeric <= 12) return String(numeric);
  const parsed = new Date(`1 ${value} 2000`);
  return Number.isNaN(parsed.getTime()) ? "" : String(parsed.getMonth() + 1);
}

function validDateParts(year: string, month: string, day: string): string {
  const yearNumber = Number.parseInt(year, 10);
  const monthNumber = Number.parseInt(month, 10);
  const dayNumber = Number.parseInt(day, 10);
  const parsed = new Date(Date.UTC(yearNumber, monthNumber - 1, dayNumber));
  if (
    parsed.getUTCFullYear() !== yearNumber ||
    parsed.getUTCMonth() !== monthNumber - 1 ||
    parsed.getUTCDate() !== dayNumber
  ) {
    return "";
  }
  return `${String(yearNumber).padStart(4, "0")}-${String(monthNumber).padStart(2, "0")}-${String(dayNumber).padStart(2, "0")}`;
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

function collectUploadStrings(
  value: JotformAnswerValue | undefined,
  output: string[],
): void {
  if (typeof value === "string") {
    output.push(value.trim());
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item) => collectUploadStrings(item, output));
    return;
  }
  if (!value || typeof value !== "object") return;

  const preferredKeys = [
    "url",
    "downloadUrl",
    "download",
    "link",
    "href",
    "file",
    "name",
  ];
  const seen = new Set(preferredKeys);
  preferredKeys.forEach((key) => collectUploadStrings(value[key], output));
  Object.entries(value).forEach(([key, nested]) => {
    if (!seen.has(key)) collectUploadStrings(nested, output);
  });
}

function decodeHtml(value: string): string {
  return value
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#0*39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) =>
      safeCodePoint(Number.parseInt(hex, 16)),
    )
    .replace(/&#([0-9]+);/g, (_, decimal: string) =>
      safeCodePoint(Number.parseInt(decimal, 10)),
    );
}

function safeCodePoint(value: number): string {
  try {
    return String.fromCodePoint(value);
  } catch {
    return "";
  }
}
