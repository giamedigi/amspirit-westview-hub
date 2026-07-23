import "server-only";

import type { Member } from "@/lib/types";
import { JotformMappingNotConfiguredError } from "../errors";
import type { RawJotformSubmission } from "../raw-types";

export function adaptMemberSubmission(
  submission: RawJotformSubmission,
): Member {
  void submission;
  throw new JotformMappingNotConfiguredError("Member");
}
