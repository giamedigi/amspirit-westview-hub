­r‡^Ñf¥–Ø¦{O,yÊ'vÃ®¶›­import assert from "node:assert/strict";
import test from "node:test";
import {
  proxyPublicMemberImage,
  validateApprovedRedirect,
  validateJotformUploadUrl,
} from "../src/services/jotform/member-image-proxy.ts";

const MEMBER_ID = "member-e7bd47acc2e25c89";
const SOURCE =
  "https://www.jotform.com/uploads/example/form/submission/photo.jpg";
const IMAGE_BYTES = new Uint8Array([137, 80, 78, 71]);

function dependencies(overrides = {}) {
  return {
    apiKey: "server-test-key",
    lookup: async () => ({ status: "found", sourceUrl: SOURCE }),
    fetchImpl: async (_url, init) => {
      assert.equal(init.headers.APIKEY, "server-test-key");
      assert.equal(init.redirect, "manual");
      return new Response(IMAGE_BYTES, {
        headers: { "Content-Type": "image/png" },
      });
    },
    ...overrides,
  };
}

test("serves an allowed headshot", async () => {
  const response = await proxyPublicMemberImage(
    MEMBER_ID,
    "headshot",
    dependencies(),
  );
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("content-type"), "image/png");
  assert.match(response.headers.get("cache-control"), /s-maxage=604800/);
  assert.deepEqual(new Uint8Array(await response.arrayBuffer()), IMAGE_BYTES);
});

test("serves an allowed business card", async () => {
  const response = await proxyPublicMemberImage(
    MEMBER_ID,
    "business-card",
    dependencies(),
  );
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("content-disposition"), "inline");
});

test("returns 404 for a missing image", async () => {
  const response = await proxyPublicMemberImage(
    MEMBER_ID,
    "headshot",
    dependencies({ lookup: async () => ({ status: "not-found" }) }),
  );
  assert.equal(response.status, 404);
  assert.equal(response.headers.get("cache-control"), "no-store");
});

test("returns 404 for an invalid member ID", async () => {
  let lookupCalled = false;
  const response = await proxyPublicMemberImage(
    "not-a-member",
    "headshot",
    dependencies({
      lookup: async () => {
        lookupCalled = true;
        return { status: "found", sourceUrl: SOURCE };
      },
    }),
  );
  assert.equal(response.status, 404);
  assert.equal(lookupCalled, false);
});

test("returns 404 for an unsupported image type", async () => {
  const response = await proxyPublicMemberImage(
    MEMBER_ID,
    "avatar",
    dependencies(),
  );
  assert.equal(response.status, 404);
});

test("rejects unexpected hosts and paths", async () => {
  assert.equal(
    validateJotformUploadUrl("https://evil.example/uploads/photo.jpg"),
    undefined,
  );
  assert.equal(
    validateJotformUploadUrl("https://www.jotform.com/login"),
    undefined,
  );
  assert.equal(
    validateJotformUploadUrl(
      "https://www.jotform.com:8443/uploads/example/photo.jpg",
    ),
    undefined,
  );
  const response = await proxyPublicMemberImage(
    MEMBER_ID,
    "headshot",
    dependencies({
      lookup: async () => ({
        status: "found",
        sourceUrl: "https://evil.example/uploads/photo.jpg",
      }),
    }),
  );
  assert.equal(response.status, 404);
});

test("rejects a non-image upstream response", async () => {
  const response = await proxyPublicMemberImage(
    MEMBER_ID,
    "headshot",
    dependencies({
      fetchImpl: async () =>
        new Response("<html>Login</html>", {
          headers: { "Content-Type": "text/html" },
        }),
    }),
  );
  assert.equal(response.status, 502);
});

test("follows an approved Jotform storage redirect without forwarding credentials", async () => {
  const requests = [];
  const response = await proxyPublicMemberImage(
    MEMBER_ID,
    "headshot",
    dependencies({
      fetchImpl: async (url, init) => {
        requests.push({ url: String(url), headers: init.headers });
        if (requests.length === 1) {
          return new Response(null, {
            status: 302,
            headers: {
              Location: "https://s3.amazonaws.com/jufs/example/photo.jpg",
            },
          });
        }
        return new Response(IMAGE_BYTES, {
          headers: { "Content-Type": "image/png" },
        });
      },
    }),
  );

  assert.equal(response.status, 200);
  assert.equal(requests.length, 2);
  assert.equal(requests[0].headers.APIKEY, "server-test-key");
  assert.equal("APIKEY" in requests[1].headers, false);
});

test("rejects redirects outside approved Jotform storage", async () => {
  assert.equal(
    validateApprovedRedirect(
      "https://evil.example/photo.jpg",
      new URL(SOURCE),
    ),
    undefined,
  );
  const response = await proxyPublicMemberImage(
    MEMBER_ID,
    "headshot",
    dependencies({
      fetchImpl: async () =>
        new Response(null, {
          status: 302,
          headers: { Location: "https://evil.example/photo.jpg" },
        }),
    }),
  );
  assert.equal(response.status, 502);
});

test("handles an upstream failure without exposing details", async () => {
  const response = await proxyPublicMemberImage(
    MEMBER_ID,
    "headshot",
    dependencies({
      fetchImpl: async () => {
        throw new Error("sensitive upstream detail");
      },
    }),
  );
  assert.equal(response.status, 502);
  assert.equal(await response.text(), "Image is temporarily unavailable.");
  assert.equal(response.headers.get("cache-control"), "no-store");
});

test("rejects responses over the size limit", async () => {
  const response = await proxyPublicMemberImage(
    MEMBER_ID,
    "headshot",
    dependencies({
      fetchImpl: async () =>
        new Response(new Uint8Array(1), {
          headers: {
            "Content-Type": "image/png",
            "Content-Length": String(8 * 1024 * 1024 + 1),
          },
        }),
    }),
  );
  assert.equal(response.status, 502);
});
