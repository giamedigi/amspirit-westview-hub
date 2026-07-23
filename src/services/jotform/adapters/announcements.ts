import "server-only";

import type { Announcement } from "@/lib/types";
import { JotformMappingNotConfiguredError } from "../errors";
import type { RawJotformSubmission } from "../raw-types";

export function adaptAnnouncementSubmission(
  submission: RawJotformSubmission,
): Announcement {
  void submission;
  throw new JotformMappingNotConfiguredError("Announcement");
}
