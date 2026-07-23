import { NextResponse } from "next/server";
import {
  isJotformFormKey,
} from "@/services/jotform/env.server";
import { hasValidInspectionToken } from "@/services/jotform/inspection-auth.server";
import { inspectJotformFieldMap } from "@/services/jotform/inspection.server";

export const dynamic = "force-dynamic";

const privateNoStoreHeaders = {
  "Cache-Control": "private, no-store, max-age=0",
  "Content-Security-Policy": "default-src 'none'",
  Pragma: "no-cache",
  Vary: "x-inspection-token",
  "X-Content-Type-Options": "nosniff",
  "X-Robots-Tag": "noindex, nofollow, noarchive",
};

export async function GET(
  request: Request,
  context: { params: Promise<{ kind: string }> },
) {
  if (!hasValidInspectionToken(request)) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401, headers: privateNoStoreHeaders },
    );
  }

  const { kind } = await context.params;
  if (!isJotformFormKey(kind)) {
    return NextResponse.json(
      { error: "Not found" },
      { status: 404, headers: privateNoStoreHeaders },
    );
  }

  try {
    const inspection = await inspectJotformFieldMap(kind);
    return NextResponse.json(inspection, {
      status: 200,
      headers: privateNoStoreHeaders,
    });
  } catch {
    return NextResponse.json(
      { error: "Inspection is temporarily unavailable." },
      { status: 502, headers: privateNoStoreHeaders },
    );
  }
}
