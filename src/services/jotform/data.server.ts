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
import { inspectAnnouncementSubmission } from "./adapters/announcements";
import { inspectLunchPairingSubmission } from "./adapters/lunch-pairings";
import { inspectMemberEventSubmission } from "./adapters/member-events";
import { inspectMemberSubmission } from "./adapters/members";
import {
  type AdaptationResult,
  type RejectionCategory,
  submissionTimestamp,
} from "./adapters/values";
import { fetchFormSubmissions } from "./client.server";
import {
  getJotformFormId,
  hasJotformConfiguration,
  type JotformFormKey,
} from "./env.server";
import type { RawJotformSubmission } from "./raw-types";
import {
  memberImagePath,
  type MemberImageType,
} from "./member-images";

export type DataSource = "live" | "mock" | "unavailable";

export interface DataResult<T> {
  data: T;
  source: DataSource;
  error: boolean;
}

interface AdaptationStats {
  received: number;
  adapted: number;
  rejected: number;
  rejectionCategories: Partial<Record<RejectionCategory, number>>;
  datesParsed: {
    successful: number;
    failed: number;
    notApplicable: number;
  };
}

export async function getMembers(): Promise<DataResult<Member[]>> {
  if (!hasJotformConfiguration("members")) {
    return { data: [...mockMembers], source: "mock", error: false };
  }
  try {
    const { records, stats } = await loadLiveMembers();
    records.sort((a, b) => a.fullName.localeCompare(b.fullName));
    logSafeDiagnostics("members", stats, 0);
    return {
      data: records.map(withPublicMemberImageUrls),
      source: "live",
      error: false,
    };
  } catch (error) {
    logSafeFailure("members", error);
    return { data: [], source: "unavailable", error: true };
  }
}

export async function getPublicMemberImageSource(
  memberId: string,
  imageType: MemberImageType,
): Promise<
  | { status: "found"; sourceUrl: string }
  | { status: "not-found" }
  | { status: "unavailable" }
> {
  if (!hasJotformConfiguration("members")) return { status: "not-found" };
  try {
    const { records } = await loadLiveMembers();
    const member = records.find((item) => item.id === memberId);
    const sourceUrl =
      imageType === "headshot"
        ? member?.headshot
        : member?.businessCardImage;
    return sourceUrl
      ? { status: "found", sourceUrl }
      : { status: "not-found" };
  } catch (error) {
    logSafeFailure("members", error);
    return { status: "unavailable" };
  }
}

export async function getMemberEvents(): Promise<DataResult<MemberEvent[]>> {
  if (!hasJotformConfiguration("events")) {
    return { data: [...mockEvents], source: "mock", error: false };
  }
  try {
    const submissions = await fetchFormSubmissions(getJotformFormId("events"));
    const { records, stats } = adaptSubmissions(
      submissions,
      inspectMemberEventSubmission,
    );
    records.sort((a, b) => a.date.localeCompare(b.date));
    const today = localDateKey(new Date());
    const removedFromUpcomingDisplay = records.filter(
      (event) => event.date < today,
    ).length;
    logSafeDiagnostics("events", stats, removedFromUpcomingDisplay);
    return { data: records, source: "live", error: false };
  } catch (error) {
    logSafeFailure("events", error);
    return { data: [], source: "unavailable", error: true };
  }
}

export async function getAnnouncements(
  today = new Date(),
): Promise<DataResult<Announcement[]>> {
  if (!hasJotformConfiguration("announcements")) {
    return {
      data: activeAnnouncements([...mockAnnouncements], today),
      source: "mock",
      error: false,
    };
  }
  try {
    const submissions = await fetchFormSubmissions(
      getJotformFormId("announcements"),
    );
    const { records, stats } = adaptSubmissions(
      submissions,
      inspectAnnouncementSubmission,
    );
    const active = activeAnnouncements(records, today);
    logSafeDiagnostics(
      "announcements",
      stats,
      records.length - active.length,
    );
    return { data: active, source: "live", error: false };
  } catch (error) {
    logSafeFailure("announcements", error);
    return { data: [], source: "unavailable", error: true };
  }
}

export async function getLunchMonths(): Promise<DataResult<LunchMonth[]>> {
  if (!hasJotformConfiguration("lunch")) {
    return { data: [...mockLunchMonths], source: "mock", error: false };
  }
  try {
    const submissions = await fetchFormSubmissions(getJotformFormId("lunch"));
    const { records, stats, acceptedSubmissions } = adaptSubmissions(
      submissions,
      inspectLunchPairingSubmission,
    );
    const newestByMonth = new Map<
      string,
      { month: LunchMonth; timestamp: number }
    >();
    records.forEach((month, index) => {
      const submission = acceptedSubmissions[index];
      const key = `${month.year}-${String(month.month).padStart(2, "0")}`;
      const timestamp = submissionTimestamp(submission);
      const existing = newestByMonth.get(key);
      if (!existing || timestamp > existing.timestamp) {
        newestByMonth.set(key, { month, timestamp });
      }
    });
    const data = [...newestByMonth.values()]
      .map(({ month }) => month)
      .sort((a, b) => a.year - b.year || a.month - b.month);
    logSafeDiagnostics("lunch", stats, records.length - data.length);
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

function adaptSubmissions<T>(
  submissions: RawJotformSubmission[],
  inspect: (submission: RawJotformSubmission) => AdaptationResult<T>,
): {
  records: T[];
  acceptedSubmissions: RawJotformSubmission[];
  stats: AdaptationStats;
} {
  const records: T[] = [];
  const acceptedSubmissions: RawJotformSubmission[] = [];
  const stats: AdaptationStats = {
    received: submissions.length,
    adapted: 0,
    rejected: 0,
    rejectionCategories: {},
    datesParsed: { successful: 0, failed: 0, notApplicable: 0 },
  };

  submissions.forEach((submission) => {
    const result = inspect(submission);
    if (result.dateParsed === true) stats.datesParsed.successful += 1;
    else if (result.dateParsed === false) stats.datesParsed.failed += 1;
    else stats.datesParsed.notApplicable += 1;

    if (result.record) {
      records.push(result.record);
      acceptedSubmissions.push(submission);
      stats.adapted += 1;
      return;
    }

    stats.rejected += 1;
    const category = result.rejectionCategory ?? "missing_required_field";
    stats.rejectionCategories[category] =
      (stats.rejectionCategories[category] ?? 0) + 1;
  });

  return { records, acceptedSubmissions, stats };
}

async function loadLiveMembers(): Promise<{
  records: Member[];
  stats: AdaptationStats;
}> {
  const submissions = await fetchFormSubmissions(getJotformFormId("members"));
  return adaptSubmissions(submissions, inspectMemberSubmission);
}

function withPublicMemberImageUrls(member: Member): Member {
  return {
    ...member,
    headshot: member.headshot
      ? memberImagePath(member.id, "headshot")
      : undefined,
    businessCardImage: member.businessCardImage
      ? memberImagePath(member.id, "business-card")
      : undefined,
  };
}

function localDateKey(date: Date): string {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function logSafeDiagnostics(
  formKind: JotformFormKey,
  stats: AdaptationStats,
  removedByDisplayFiltering: number,
): void {
  console.info("[Jotform diagnostics]", {
    formKind,
    submissionsReceived: stats.received,
    successfullyAdapted: stats.adapted,
    rejected: stats.rejected,
    rejectionCategories: stats.rejectionCategories,
    datesParsed: stats.datesParsed,
    removedByDisplayFiltering,
  });
}

function logSafeFailure(key: JotformFormKey, error: unknown): void {
  const category = error instanceof Error ? error.name : "UnknownJotformError";
  console.error(`[Jotform] ${key} data unavailable (${category}).`);
}
