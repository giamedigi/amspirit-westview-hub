­r‡^Ñf¥–Ø¦{O,yÊ'vÃ®¶›­type MemberImageType = "headshot" | "business-card";

const ALLOWED_UPLOAD_HOSTS = new Set(["www.jotform.com"]);
const MEMBER_ID_PATTERN = /^member-[a-f0-9]{16}$/;
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const UPSTREAM_TIMEOUT_MS = 8_000;
const MAX_REDIRECTS = 3;
const SUCCESS_CACHE_CONTROL =
  "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400";
const ERROR_CACHE_CONTROL = "no-store";
const ALLOWED_IMAGE_TYPES = new Set([
  "image/avif",
  "image/gif",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

type ImageLookupResult =
  | { status: "found"; sourceUrl: string }
  | { status: "not-found" }
  | { status: "unavailable" };

export interface ProxyDependencies {
  apiKey: string;
  fetchImpl: typeof fetch;
  lookup: (
    memberId: string,
    imageType: MemberImageType,
  ) => Promise<ImageLookupResult>;
}

export async function proxyPublicMemberImage(
  memberId: string,
  imageTypeValue: string,
  dependencies: ProxyDependencies,
): Promise<Response> {
  if (
    !MEMBER_ID_PATTERN.test(memberId) ||
    !isMemberImageType(imageTypeValue)
  ) {
    return notFound();
  }

  const lookupResult = await dependencies.lookup(memberId, imageTypeValue);
  if (lookupResult.status === "not-found") return notFound();
  if (lookupResult.status === "unavailable") return upstreamFailure();

  const sourceUrl = validateJotformUploadUrl(lookupResult.sourceUrl);
  if (!sourceUrl) return notFound();

  let upstream: Response;
  try {
    upstream = await fetchApprovedUpload(sourceUrl, dependencies);
  } catch {
    return upstreamFailure();
  }

  if (!upstream.ok) return upstreamFailure();

  const contentType = normalizeContentType(
    upstream.headers.get("content-type"),
  );
  if (!contentType || !ALLOWED_IMAGE_TYPES.has(contentType)) {
    return upstreamFailure();
  }

  const contentLength = parseContentLength(
    upstream.headers.get("content-length"),
  );
  if (contentLength !== undefined && contentLength > MAX_IMAGE_BYTES) {
    return upstreamFailure();
  }

  try {
    const bytes = await readLimitedBody(upstream, MAX_IMAGE_BYTES);
    const body = new ArrayBuffer(bytes.byteLength);
    new Uint8Array(body).set(bytes);
    return new Response(body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Length": String(bytes.byteLength),
        "Cache-Control": SUCCESS_CACHE_CONTROL,
        "Content-Disposition": "inline",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return upstreamFailure();
  }
}

async function fetchApprovedUpload(
  sourceUrl: URL,
  dependencies: ProxyDependencies,
): Promise<Response> {
  let currentUrl = sourceUrl;

  for (let redirectCount = 0; redirectCount <= MAX_REDIRECTS; redirectCount += 1) {
    const isAuthenticatedJotformRequest =
      currentUrl.hostname.toLowerCase() === "www.jotform.com";
    const response = await dependencies.fetchImpl(currentUrl, {
      headers: {
        Accept: "image/avif,image/webp,image/png,image/jpeg,image/gif",
        ...(isAuthenticatedJotformRequest
          ? { APIKEY: dependencies.apiKey }
          : {}),
      },
      redirect: "manual",
      cache: "no-store",
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });

    if (!isRedirect(response.status)) return response;
    if (redirectCount === MAX_REDIRECTS) {
      throw new Error("Too many upstream redirects.");
    }

    const location = response.headers.get("location");
    const redirectUrl = location
      ? validateApprovedRedirect(location, currentUrl)
      : undefined;
    if (!redirectUrl) throw new Error("Unapproved upstream redirect.");
    currentUrl = redirectUrl;
  }

  throw new Error("Unable to retrieve the image.");
}

function isMemberImageType(value: string): value is MemberImageType {
  return value === "headshot" || value === "business-card";
}

export function validateJotformUploadUrl(value: string): URL | undefined {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" && url.protocol !== "http:") return;
    if (!ALLOWED_UPLOAD_HOSTS.has(url.hostname.toLowerCase())) return;
    if (url.port) return;
    if (!url.pathname.startsWith("/uploads/")) return;
    if (url.username || url.password) return;
    url.hash = "";
    return url;
  } catch {
    return;
  }
}

export function validateApprovedRedirect(
  value: string,
  baseUrl: URL,
): URL | undefined {
  try {
    const url = new URL(value, baseUrl);
    if (url.protocol !== "https:" || url.port) return;
    if (url.username || url.password) return;

    const hostname = url.hostname.toLowerCase();
    const approved =
      (hostname === "www.jotform.com" &&
        url.pathname.startsWith("/uploads/")) ||
      (hostname === "s3.amazonaws.com" &&
        url.pathname.startsWith("/jufs/")) ||
      hostname === "files.jotform.com";
    if (!approved) return;

    url.hash = "";
    return url;
  } catch {
    return;
  }
}

async function readLimitedBody(
  response: Response,
  maximumBytes: number,
): Promise<Uint8Array> {
  if (!response.body) return new Uint8Array();
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maximumBytes) {
        await reader.cancel();
        throw new Error("Image exceeded the response-size limit.");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const bytes = new Uint8Array(total);
  let offset = 0;
  chunks.forEach((chunk) => {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  });
  return bytes;
}

function normalizeContentType(value: string | null): string | undefined {
  return value?.split(";")[0]?.trim().toLowerCase() || undefined;
}

function parseContentLength(value: string | null): number | undefined {
  if (!value) return;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
}

function isRedirect(status: number): boolean {
  return status >= 300 && status < 400;
}

function notFound(): Response {
  return new Response("Image not found.", {
    status: 404,
    headers: { "Cache-Control": ERROR_CACHE_CONTROL },
  });
}

function upstreamFailure(): Response {
  return new Response("Image is temporarily unavailable.", {
    status: 502,
    headers: { "Cache-Control": ERROR_CACHE_CONTROL },
  });
}
