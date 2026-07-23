import "server-only";

import { getJotformApiKey } from "./env.server";
import { JotformRequestError } from "./errors";
import { parseEnvelope, parseQuestions, parseSubmissions } from "./guards";
import type {
  JotformEnvelope,
  RawJotformQuestion,
  RawJotformSubmission,
} from "./raw-types";

const JOTFORM_API_BASE_URL = "https://api.jotform.com";
const DEFAULT_TIMEOUT_MS = 8_000;
const DEFAULT_REVALIDATE_SECONDS = 300;

interface NextFetchInit extends RequestInit {
  next?: { revalidate: number; tags?: string[] };
}

interface SubmissionFetchOptions {
  pageSize?: number;
  maxPages?: number;
  revalidateSeconds?: number;
}

async function requestJotform<T>(
  path: string,
  parseContent: (content: unknown) => T,
  options: {
    searchParams?: URLSearchParams;
    revalidateSeconds?: number;
    cacheTags?: string[];
    noStore?: boolean;
  } = {},
): Promise<JotformEnvelope<T>> {
  const url = new URL(path, JOTFORM_API_BASE_URL);
  if (options.searchParams) url.search = options.searchParams.toString();

  const request: NextFetchInit = {
    headers: {
      Accept: "application/json",
      APIKEY: getJotformApiKey(),
    },
    signal: AbortSignal.timeout(DEFAULT_TIMEOUT_MS),
  };
  if (options.noStore) {
    request.cache = "no-store";
  } else {
    request.next = {
      revalidate:
        options.revalidateSeconds ?? DEFAULT_REVALIDATE_SECONDS,
      tags: options.cacheTags,
    };
  }

  let response: Response;
  try {
    response = await fetch(url, request);
  } catch (error) {
    if (error instanceof Error && error.name === "TimeoutError") {
      throw new JotformRequestError("Jotform request timed out.");
    }
    throw new JotformRequestError("Unable to reach Jotform.");
  }

  if (!response.ok) {
    throw new JotformRequestError(
      `Jotform request failed with HTTP ${response.status}.`,
      response.status,
    );
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new JotformRequestError("Jotform returned invalid JSON.");
  }

  const envelope = parseEnvelope(payload, parseContent);
  if (envelope.responseCode < 200 || envelope.responseCode >= 300) {
    throw new JotformRequestError(
      "Jotform returned an unsuccessful response.",
      response.status,
      envelope.responseCode,
    );
  }
  return envelope;
}

export async function fetchFormQuestions(
  formId: string,
  options: { noStore?: boolean } = {},
): Promise<RawJotformQuestion[]> {
  const response = await requestJotform(
    `/form/${encodeURIComponent(formId)}/questions`,
    parseQuestions,
    {
      cacheTags: [`jotform-form-${formId}-questions`],
      noStore: options.noStore,
    },
  );
  return response.content;
}

export async function fetchFormSubmissionSample(
  formId: string,
): Promise<RawJotformSubmission | undefined> {
  const searchParams = new URLSearchParams({
    limit: "1",
    offset: "0",
    orderby: "created_at",
  });
  const response = await requestJotform(
    `/form/${encodeURIComponent(formId)}/submissions`,
    parseSubmissions,
    { searchParams, noStore: true },
  );
  return response.content[0];
}

export async function fetchFormSubmissions(
  formId: string,
  options: SubmissionFetchOptions = {},
): Promise<RawJotformSubmission[]> {
  const pageSize = Math.min(Math.max(options.pageSize ?? 100, 1), 1_000);
  const maxPages = Math.max(options.maxPages ?? 25, 1);
  const submissions: RawJotformSubmission[] = [];

  for (let page = 0; page < maxPages; page += 1) {
    const offset = page * pageSize;
    const searchParams = new URLSearchParams({
      limit: String(pageSize),
      offset: String(offset),
      orderby: "created_at",
    });
    const response = await requestJotform(
      `/form/${encodeURIComponent(formId)}/submissions`,
      parseSubmissions,
      {
        searchParams,
        revalidateSeconds: options.revalidateSeconds,
        cacheTags: [`jotform-form-${formId}-submissions`],
      },
    );
    submissions.push(...response.content);

    const totalCount =
      typeof response.resultSet?.count === "number"
        ? response.resultSet.count
        : undefined;
    if (
      response.content.length < pageSize ||
      (totalCount !== undefined && submissions.length >= totalCount)
    ) {
      return submissions;
    }
  }

  throw new JotformRequestError(
    `Jotform pagination exceeded the configured ${maxPages}-page safety limit.`,
  );
}
