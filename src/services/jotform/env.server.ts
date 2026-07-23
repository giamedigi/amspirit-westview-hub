import "server-only";

import { JotformConfigurationError } from "./errors";

export type JotformFormKey =
  | "members"
  | "events"
  | "announcements"
  | "lunch";

const formEnvironmentVariables: Record<JotformFormKey, string> = {
  members: "JOTFORM_MEMBER_DIRECTORY_FORM_ID",
  events: "JOTFORM_MEMBER_EVENTS_FORM_ID",
  announcements: "JOTFORM_ANNOUNCEMENTS_FORM_ID",
  lunch: "JOTFORM_LUNCH_PAIRINGS_FORM_ID",
};

function requireEnvironmentVariable(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new JotformConfigurationError(name);
  }
  return value;
}

export function getJotformApiKey(): string {
  return requireEnvironmentVariable("JOTFORM_API_KEY");
}

export function getJotformInspectionToken(): string {
  return requireEnvironmentVariable("JOTFORM_INSPECTION_TOKEN");
}

export function getJotformFormId(key: JotformFormKey): string {
  return requireEnvironmentVariable(formEnvironmentVariables[key]);
}

export function isJotformFormKey(value: string): value is JotformFormKey {
  return Object.hasOwn(formEnvironmentVariables, value);
}
