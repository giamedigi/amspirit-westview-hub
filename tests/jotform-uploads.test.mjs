import assert from "node:assert/strict";
import test from "node:test";
import { uploadUrl } from "../src/services/jotform/adapters/values.ts";

function submission(answer) {
  return {
    id: "not-used",
    answers: {
      10: answer,
    },
  };
}

test("uses a direct upload URL", () => {
  assert.equal(
    uploadUrl(
      submission({ answer: "https://www.jotform.com/uploads/example/headshot.jpg" }),
      10,
    ),
    "https://www.jotform.com/uploads/example/headshot.jpg",
  );
});

test("uses a URL from an array or nested upload object", () => {
  assert.equal(
    uploadUrl(
      submission({
        answer: [{ file: { downloadUrl: "https://example.com/card image.png" } }],
      }),
      "10",
    ),
    "https://example.com/card%20image.png",
  );
});

test("falls back to prettyFormat when answer contains only a filename", () => {
  assert.equal(
    uploadUrl(
      submission({
        answer: "headshot.jpg",
        prettyFormat:
          '<a href="https://www.jotform.com/uploads/example/headshot%20photo.jpg?x=1&amp;y=2">headshot.jpg</a>',
      }),
      10,
    ),
    "https://www.jotform.com/uploads/example/headshot%20photo.jpg?x=1&y=2",
  );
});

test("rejects unsafe upload protocols", () => {
  assert.equal(
    uploadUrl(submission({ answer: { url: "javascript:alert(1)" } }), 10),
    undefined,
  );
});
