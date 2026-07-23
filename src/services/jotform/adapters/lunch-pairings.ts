import "server-only";

import type { LunchMonth } from "@/lib/types";
import { JotformMappingNotConfiguredError } from "../errors";
import type { RawJotformSubmission } from "../raw-types";

export function adaptLunchPairingSubmission(
  submission: RawJotformSubmission,
): LunchMonth {
  void submission;
  throw new JotformMappingNotConfiguredError("Lunch pairing");
}
