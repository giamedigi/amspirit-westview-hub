import "server-only";

import type { MemberEvent } from "@/lib/types";
import { JotformMappingNotConfiguredError } from "../errors";
import type { RawJotformSubmission } from "../raw-types";

export function adaptMemberEventSubmission(
  submission: RawJotformSubmission,
): MemberEvent {
  void submission;
  throw new JotformMappingNotConfiguredError("Member event");
}
