/**
 * Raw Jotform transport types. These must not escape the server-side service
 * boundary or be passed directly to UI components.
 */
export type JotformScalar = string | number | boolean | null;
export type JotformAnswerValue =
  | JotformScalar
  | JotformAnswerValue[]
  | { [key: string]: JotformAnswerValue };

export interface RawJotformQuestion {
  qid: string;
  name?: string;
  text?: string;
  type?: string;
  order?: string;
  required?: string;
  [key: string]: unknown;
}

export interface RawJotformAnswer {
  name?: string;
  text?: string;
  type?: string;
  answer?: JotformAnswerValue;
  prettyFormat?: string;
  [key: string]: unknown;
}

export interface RawJotformSubmission {
  id: string;
  form_id?: string;
  created_at?: string;
  updated_at?: string;
  status?: string;
  answers: Record<string, RawJotformAnswer>;
  [key: string]: unknown;
}

export interface JotformResultSet {
  offset?: number;
  limit?: number;
  count?: number;
  [key: string]: unknown;
}

export interface JotformEnvelope<T> {
  responseCode: number;
  message: string;
  content: T;
  resultSet?: JotformResultSet;
  "limit-left"?: number;
}
