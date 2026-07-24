import assert from "node:assert/strict";
import test from "node:test";
import { proxyPublicEventImage } from "../src/services/jotform/event-image-proxy.ts";

const EVENT_ID = "event-e7bd47acc2e25c89";
const SOURCE =
  "https://www.jotform.com/uploads/example/form/submission/flyer.jpg";
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

for (const imageType of ["flyer", "social-graphic"]) {
  test(`serves a valid ${imageType}`, async () => {
    const response = await proxyPublicEventImage(
      EVENT_ID,
      imageType,
      dependencies(),
    );
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("content-type"), "image/png");
    assert.match(response.headers.get("cache-control"), /max-age=86400/);
    assert.match(response.headers.get("cache-control"), /s-maxage=604800/);
  });
}

test("returns 404 for a missing event or image", async () => {
  for (const status of ["not-found"]) {
    const response = await proxyPublicEventImage(
      EVENT_ID,
      "flyer",
      dependencies({ lookup: async () => ({ status }) }),
    );
    assert.equal(response.status, 404);
    assert.equal(response.headers.get("cache-control"), "no-store");
  }
});

test("returns 404 for an event not eligible for public display", async () => {
  const response = await proxyPublicEventImage(
    EVENT_ID,
    "flyer",
    dependencies({ lookup: async () => ({ status: "not-found" }) }),
  );
  assert.equal(response.status, 404);
});

test("rejects invalid event IDs and unsupported image types", async () => {
  assert.equal(
    (
      await proxyPublicEventImage(
        "submission-123",
        "flyer",
        dependencies(),
      )
    ).status,
    404,
  );
  assert.equal(
    (
      await proxyPublicEventImage(EVENT_ID, "banner", dependencies())
    ).status,
    404,
  );
});

test("rejects an unapproved source host", async () => {
  const response = await proxyPublicEventImage(
    EVENT_ID,
    "flyer",
    dependencies({
      lookup: async () => ({
        status: "found",
        sourceUrl: "https://evil.example/uploads/flyer.jpg",
      }),
    }),
  );
  assert.equal(response.status, 404);
});

test("rejects an unapproved redirect host", async () => {
  const response = await proxyPublicEventImage(
    EVENT_ID,
    "flyer",
    dependencies({
      fetchImpl: async () =>
        new Response(null, {
          status: 302,
          headers: { Location: "https://evil.example/flyer.jpg" },
        }),
    }),
  );
  assert.equal(response.status, 502);
  assert.equal(response.headers.get("cache-control"), "no-store");
});

test("rejects a non-image response", async () => {
  const response = await proxyPublicEventImage(
    EVENT_ID,
    "flyer",
    dependencies({
      fetchImpl: async () =>
        new Response("<html>Login</html>", {
          headers: { "Content-Type": "text/html" },
        }),
    }),
  );
  assert.equal(response.status, 502);
});

test("handles upstream failure safely", async () => {
  const response = await proxyPublicEventImage(
    EVENT_ID,
    "flyer",
    dependencies({
      fetchImpl: async () => {
        throw new Error("private upstream detail");
      },
    }),
  );
  assert.equal(response.status, 502);
  assert.equal(await response.text(), "Image is temporarily unavailable.");
  assert.equal(response.headers.get("cache-control"), "no-store");
});

test("strips credentials before an approved storage redirect", async () => {
  const requests = [];
  const response = await proxyPublicEventImage(
    EVENT_ID,
    "social-graphic",
    dependencies({
      fetchImpl: async (url, init) => {
        requests.push({ url: String(url), headers: init.headers });
        if (requests.length === 1) {
          return new Response(null, {
            status: 302,
            headers: {
              Location: "https://s3.amazonaws.com/jufs/example/graphic.png",
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
  assert.equal(requests[0].headers.APIKEY, "server-test-key");
  assert.equal("APIKEY" in requests[1].headers, false);
});

test("rejects responses over the size limit", async () => {
  const response = await proxyPublicEventImage(
    EVENT_ID,
    "flyer",
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
  assert.equal(response.headers.get("cache-control"), "no-store");
});
