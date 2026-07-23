const formVariables = {
  members: "JOTFORM_MEMBER_DIRECTORY_FORM_ID",
  events: "JOTFORM_MEMBER_EVENTS_FORM_ID",
  announcements: "JOTFORM_ANNOUNCEMENTS_FORM_ID",
  lunch: "JOTFORM_LUNCH_PAIRINGS_FORM_ID",
};

const formKind = process.argv[2];
if (!formKind || !Object.hasOwn(formVariables, formKind)) {
  console.error(
    "Usage: npm run jotform:inspect -- <members|events|announcements|lunch>",
  );
  process.exitCode = 1;
} else {
  await inspectForm(formKind);
}

async function inspectForm(kind) {
  try {
    const apiKey = requiredEnvironmentVariable("JOTFORM_API_KEY");
    const formId = requiredEnvironmentVariable(formVariables[kind]);
    const baseUrl = `https://api.jotform.com/form/${encodeURIComponent(formId)}`;
    const [questionsEnvelope, submissionsEnvelope] = await Promise.all([
      requestJson(`${baseUrl}/questions`, apiKey),
      requestJson(`${baseUrl}/submissions?limit=1&offset=0`, apiKey),
    ]);

    const questions = normalizeQuestions(questionsEnvelope.content);
    const submission = Array.isArray(submissionsEnvelope.content)
      ? submissionsEnvelope.content[0]
      : undefined;

    const output = {
      formKind: kind,
      formId,
      questions: questions.map((question) => ({
        questionId: question.qid,
        fieldName: stringOrNull(question.name),
        fieldType: stringOrNull(question.type),
        label: stringOrNull(question.text),
        required: question.required === "Yes",
      })),
      sampleSubmissionAnswerShape: anonymizeAnswerShape(
        submission?.answers,
        questions,
      ),
      privacyNote:
        "Answer values, submission IDs, contact details, and the API key are intentionally omitted.",
    };

    console.log(JSON.stringify(output, null, 2));
  } catch (error) {
    console.error(
      error instanceof Error
        ? `Jotform inspection failed: ${error.message}`
        : "Jotform inspection failed.",
    );
    process.exitCode = 1;
  }
}

function requiredEnvironmentVariable(name) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

async function requestJson(url, apiKey) {
  let response;
  try {
    response = await fetch(url, {
      headers: { Accept: "application/json", APIKEY: apiKey },
      signal: AbortSignal.timeout(8_000),
    });
  } catch (error) {
    if (error instanceof Error && error.name === "TimeoutError") {
      throw new Error("The request timed out.");
    }
    throw new Error("Unable to reach Jotform.");
  }

  if (!response.ok) {
    throw new Error(`Jotform returned HTTP ${response.status}.`);
  }

  const payload = await response.json();
  if (
    !payload ||
    typeof payload !== "object" ||
    typeof payload.responseCode !== "number"
  ) {
    throw new Error("Jotform returned an unexpected response.");
  }
  if (payload.responseCode < 200 || payload.responseCode >= 300) {
    throw new Error(
      `Jotform returned response code ${payload.responseCode}.`,
    );
  }
  return payload;
}

function normalizeQuestions(content) {
  if (!content || typeof content !== "object" || Array.isArray(content)) {
    throw new Error("The form questions response has an unexpected shape.");
  }
  return Object.entries(content)
    .map(([fallbackQid, question]) => ({
      ...(question && typeof question === "object" ? question : {}),
      qid:
        question &&
        typeof question === "object" &&
        typeof question.qid === "string"
          ? question.qid
          : fallbackQid,
    }))
    .sort(
      (a, b) =>
        Number.parseInt(a.order ?? "0", 10) -
        Number.parseInt(b.order ?? "0", 10),
    );
}

function anonymizeAnswerShape(answers, questions) {
  if (!answers || typeof answers !== "object" || Array.isArray(answers)) {
    return [];
  }
  const questionsById = new Map(
    questions.map((question) => [question.qid, question]),
  );
  return Object.entries(answers).map(([questionId, answer]) => {
    const answerRecord =
      answer && typeof answer === "object" && !Array.isArray(answer)
        ? answer
        : {};
    const question = questionsById.get(questionId);
    return {
      questionId,
      fieldName: stringOrNull(answerRecord.name ?? question?.name),
      fieldType: stringOrNull(answerRecord.type ?? question?.type),
      answerShape: describeShape(answerRecord.answer),
    };
  });
}

function describeShape(value) {
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
  return { type: typeof value };
}

function stringOrNull(value) {
  return typeof value === "string" ? value : null;
}
