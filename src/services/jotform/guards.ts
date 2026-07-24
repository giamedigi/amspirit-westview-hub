import type {
  JotformAnswerValue,
  JotformEnvelope,
  RawJotformAnswer,
  RawJotformQuestion,
  RawJotformSubmission,
} from "./raw-types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function optionalString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function parseAnswerValue(value: unknown): JotformAnswerValue | undefined {
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }
  if (Array.isArray(value)) {
    const parsed = value.map(parseAnswerValue);
    return parsed.every((item) => item !== undefined)
      ? (parsed as JotformAnswerValue[])
      : undefined;
  }
  if (isRecord(value)) {
    const parsed: Record<string, JotformAnswerValue> = {};
    for (const [key, item] of Object.entries(value)) {
      const parsedItem = parseAnswerValue(item);
      if (parsedItem !== undefined) parsed[key] = parsedItem;
    }
    return parsed;
  }
  return undefined;
}

function parseAnswer(value: unknown): RawJotformAnswer {
  if (!isRecord(value)) return {};
  return {
    ...value,
    name: optionalString(value.name),
    text: optionalString(value.text),
    type: optionalString(value.type),
    prettyFormat: optionalString(value.prettyFormat),
    answer: parseAnswerValue(value.answer),
  };
}

export function parseQuestions(content: unknown): RawJotformQuestion[] {
  if (!isRecord(content)) {
    throw new TypeError("Jotform questions response has an unexpected shape.");
  }
  return Object.entries(content).map(([fallbackQid, value]) => {
    if (!isRecord(value)) {
      throw new TypeError("A Jotform question has an unexpected shape.");
    }
    return {
      ...value,
      qid: optionalString(value.qid) ?? fallbackQid,
      name: optionalString(value.name),
      text: optionalString(value.text),
      type: optionalString(value.type),
      order: optionalString(value.order),
      required: optionalString(value.required),
    };
  });
}

export function parseSubmissions(content: unknown): RawJotformSubmission[] {
  const submissions = Array.isArray(content)
    ? content
    : isRecord(content)
      ? Object.values(content)
      : null;
  if (!submissions) {
    throw new TypeError("Jotform submissions response has an unexpected shape.");
  }
  return submissions.map((value) => {
    if (
      !isRecord(value) ||
      (typeof value.id !== "string" && typeof value.id !== "number")
    ) {
      throw new TypeError("A Jotform submission has an unexpected shape.");
    }
    const rawAnswers = isRecord(value.answers) ? value.answers : {};
    const answers = Object.fromEntries(
      Object.entries(rawAnswers).map(([qid, answer]) => [
        qid,
        parseAnswer(answer),
      ]),
    );
    return {
      ...value,
      id: String(value.id),
      form_id: optionalString(value.form_id),
      created_at: optionalString(value.created_at),
      updated_at: optionalString(value.updated_at),
      status: optionalString(value.status),
      answers,
    };
  });
}

export function parseEnvelope<T>(
  value: unknown,
  parseContent: (content: unknown) => T,
): JotformEnvelope<T> {
  if (
    !isRecord(value) ||
    typeof value.responseCode !== "number" ||
    typeof value.message !== "string"
  ) {
    throw new TypeError("Jotform returned an unexpected response envelope.");
  }
  return {
    responseCode: value.responseCode,
    message: value.message,
    content: parseContent(value.content),
    resultSet: isRecord(value.resultSet) ? value.resultSet : undefined,
    "limit-left":
      typeof value["limit-left"] === "number"
        ? value["limit-left"]
        : undefined,
  };
}
