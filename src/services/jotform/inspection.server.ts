import "server-only";

import {
  fetchFormQuestions,
  fetchFormSubmissionSample,
} from "./client.server";
import { getJotformFormId, type JotformFormKey } from "./env.server";
import type {
  JotformAnswerValue,
  RawJotformAnswer,
  RawJotformQuestion,
} from "./raw-types";

interface AnswerShape {
  type: "array" | "boolean" | "null" | "number" | "object" | "string";
  itemTypes?: AnswerShape["type"][];
  keys?: Record<string, AnswerShape>;
}

interface SanitizedQuestion {
  questionId: string;
  fieldName: string | null;
  fieldType: string | null;
  label: string | null;
  order: number | null;
  required: boolean;
  optionLabels: string[];
  answerShape: AnswerShape | null;
}

export interface SanitizedJotformInspection {
  formKind: JotformFormKey;
  questions: SanitizedQuestion[];
  privacyNote: string;
}

export async function inspectJotformFieldMap(
  formKind: JotformFormKey,
): Promise<SanitizedJotformInspection> {
  const formId = getJotformFormId(formKind);
  const [questions, submission] = await Promise.all([
    fetchFormQuestions(formId, { noStore: true }),
    fetchFormSubmissionSample(formId),
  ]);

  return {
    formKind,
    questions: questions
      .map((question) => {
        const answer = submission?.answers[question.qid];
        return {
          questionId: question.qid,
          fieldName: stringOrNull(question.name ?? answer?.name),
          fieldType: stringOrNull(question.type ?? answer?.type),
          label: stringOrNull(question.text ?? answer?.text),
          order: numberOrNull(question.order),
          required: question.required === "Yes",
          optionLabels: extractOptionLabels(question),
          answerShape: describeAnswer(answer),
        };
      })
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    privacyNote:
      "Submission values, submission IDs, contact details, addresses, and credentials are intentionally omitted.",
  };
}

function describeAnswer(answer: RawJotformAnswer | undefined): AnswerShape | null {
  return answer?.answer === undefined ? null : describeShape(answer.answer);
}

function describeShape(value: JotformAnswerValue): AnswerShape {
  if (value === null) return { type: "null" };
  if (Array.isArray(value)) {
    return {
      type: "array",
      itemTypes: [
        ...new Set(value.map((item) => describeShape(item).type)),
      ],
    };
  }
  if (typeof value === "object") {
    return {
      type: "object",
      keys: Object.fromEntries(
        Object.entries(value).map(([key, item]) => [
          key,
          describeShape(item),
        ]),
      ),
    };
  }
  return { type: valueType(value) };
}

function valueType(
  value: string | number | boolean,
): "boolean" | "number" | "string" {
  if (typeof value === "boolean") return "boolean";
  if (typeof value === "number") return "number";
  return "string";
}

function extractOptionLabels(question: RawJotformQuestion): string[] {
  const labels: string[] = [];
  addStringOptions(labels, question.options);
  addStructuredOptions(labels, question.choices);
  addStructuredOptions(labels, question.optionLabels);
  return [...new Set(labels.map((label) => label.trim()).filter(Boolean))];
}

function addStringOptions(labels: string[], value: unknown): void {
  if (typeof value !== "string") return;
  labels.push(...value.split(/\r?\n|\|/));
}

function addStructuredOptions(labels: string[], value: unknown): void {
  if (!Array.isArray(value)) return;
  for (const option of value) {
    if (typeof option === "string") {
      labels.push(option);
    } else if (option && typeof option === "object") {
      const record = option as Record<string, unknown>;
      const label = record.label ?? record.text;
      if (typeof label === "string") labels.push(label);
    }
  }
}

function numberOrNull(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string" || !value.trim()) return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function stringOrNull(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}
