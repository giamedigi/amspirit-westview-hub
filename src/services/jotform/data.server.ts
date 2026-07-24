import "server-only";

import { announcements as mockAnnouncements } from "@/data/announcements";
import { memberEvents as mockEvents } from "@/data/events";
import { lunchMonths as mockLunchMonths } from "@/data/lunch";
import { members as mockMembers } from "@/data/members";
import type {
  Announcement,
  LunchMonth,
  Member,
  MemberEvent,
} from "@/lib/types";
import { adaptAnnouncementSubmission } from "./adapters/announcements";
import { adaptLunchPairingSubmission } from "./adapters/lunch-pairings";
import { adaptMemberEventSubmission } from "./adapters/member-events";
import { adaptMemberSubmission } from "./adapters/members";
import { submissionTimestamp } from "./adapters/values";
import { fetchFormSubmissions } from "./client.server";
import {
  getJotformFormId,
  hasJotformConfiguration,
  type JotformFormKey,
} from "./env.server";
import type { RawJotformSubmission } from "./raw-types";

export type DataSource = "live" | "mock" | "unavailable";

export interface DataResult<T> {
  data: T;
  source: DataSource;
  error: boolean;
}

export async function getMembers(): Promise<DataResult<Member[]>> {
  return loadCollection(
    "members",
    mockMembers,
    adaptMemberSubmission,
    (items) => items.sort((a, b) => a.fullName.localeCompare(b.fullName)),
  );
}

export async function getMemberEvents(): Promise<DataResult<MemberEvent[]>> {
  return loadCollection(
    "events",
    mockEvents,
    adaptMemberEventSubmission,
    (items) => items.sort((a, b) => a.date.localeCompare(b.date)),
  );
}

export async function getAnnouncements(
  today = new Date(),
): Promise<DataResult<Announcement[]>> {
  const result = await loadCollection(
    "announcements",
    mockAnnouncements,
    adaptAnnouncementSubmission,
  );
  return { ...result, data: activeAnnouncements(result.data, today) };
}

export async function getLunchMonths(): Promise<DataResult<LunchMonth[]>> {
  if (!hasJotformConfiguration("lunch")) {
    return { data: mockLunchMonths, source: "mock", error: false };
  }
  try {
    const submissions = await fetchFormSubmissions(getJotformFormId("lunch"));
    const newestByMonth = new Map<
      string,
      { month: LunchMonth; timestamp: number }
    >();
    for (const submission of submissions) {
      const month = adaptLunchPairingSubmission(submission);
      if (!month) continue;
      const key = `${month.year}-${String(month.month).padStart(2, "0")}`;
      const timestamp = submissionTimestamp(submission);
      const existing = newestByMonth.get(key);
      if (!existing || timestamp > existing.timestamp) {
        newestByMonth.set(key, { month, timestamp });
      }
    }
    const data = [...newestByMonth.values()]
      .map(({ month }) => month)
      .sort((a, b) => a.year - b.year || a.month - b.month);
    return { data, source: "live", error: false };
  } catch (error) {
    logSafeFailure("lunch", error);
    return { data: [], source: "unavailable", error: true };
  }
}

export function activeAnnouncements(
  items: Announcement[],
  today = new Date(),
): Announcement[] {
  const date = localDateKey(today);
  return items
    .filter(
      (item) => item.publishDate <= date && item.expirationDate >= date,
    )
    .sort((a, b) => b.publishDate.localeCompare(a.publishDate));
}

async function loadCollection<T>(
  key: Exclude<JotformFormKey, "lunch">,
  fallback: T[],
  adapt: (submission: RawJotformSubmission) => T | null,
  finalize: (items: T[]) => T[] = (items) => items,
): Promise<DataResult<T[]>> {
  if (!hasJotformConfiguration(key)) {
    return { data: finalize([...fallback]), source: "mock", error: false };
  }
  try {
    const submissions = await fetchFormSubmissions(getJotformFormId(key));
    const data = submissions
      .map(adapt)
      .filter((item): item is T => item !== null);
    return { data: finalize(data), source: "live", error: false };
  } catch (error) {
    logSafeFailure(key, error);
    return { data: [], source: "unavailable", error: true };
  }
}

function localDateKey(date: Date): string {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function logSafeFailure(key: JotformFormKey, error: unknown): void {
  const category = error instanceof Error ? error.name : "UnknownJotformError";
  console.error(`[Jotform] ${key} data unavailable (${category}).`);
}
