import "server-only";

import { createHash, timingSafeEqual } from "node:crypto";
import { getJotformInspectionToken } from "./env.server";

export function hasValidInspectionToken(request: Request): boolean {
  const provided = request.headers.get("x-inspection-token");
  if (!provided) return false;

  let expected: string;
  try {
    expected = getJotformInspectionToken();
  } catch {
    return false;
  }

  const providedDigest = createHash("sha256").update(provided).digest();
  const expectedDigest = createHash("sha256").update(expected).digest();
  return timingSafeEqual(providedDigest, expectedDigest);
}
