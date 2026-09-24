import { describe, it } from "node:test";
import assert from "node:assert/strict";

process.env.DATABASE_URL ??= "postgres://localhost:5432/test";

process.env.JWT_SECRET ??= "test-secret-1234567890";

process.env.GOOGLE_CLIENT_ID ??= "test";

process.env.GOOGLE_CLIENT_SECRET ??= "test";

process.env.RESEND_API_KEY ??= "test";

process.env.NEXT_PUBLIC_API_URL ??= "http://localhost:3001";

process.env.ADMIN_SEED_EMAIL ??= "admin@example.com";

const { effectiveGrade } = await import("../dist/modules/evaluation/effective-grade.js");

const { checkFinalAllowed } = await import("../dist/modules/evaluation/final-guard.js");

describe("effective grade (best wins)", () => {
  it("grade without retakes stands", () => {
    assert.equal(effectiveGrade(6, []), 6);
  });

  it("best retake wins over lower instance grade", () => {
    assert.equal(effectiveGrade(4, [7]), 7);
  });

  it("higher instance grade wins over lower retake", () => {
    assert.equal(effectiveGrade(8, [5]), 8);
  });

  it("best of many retakes wins, not the last", () => {
    assert.equal(effectiveGrade(4, [9, 5]), 9);
  });

  it("null grade with retakes takes best retake", () => {
    assert.equal(effectiveGrade(null, [6]), 6);
  });

  it("null grade without retakes stays null", () => {
    assert.equal(effectiveGrade(null, []), null);
  });
});

describe("final guard", () => {
  it("sibling in progress blocks final", () => {
    assert.equal(
      checkFinalAllowed({ requiresFinal: true, grade: 8, siblingInProgress: true }),
      "FINAL_BLOCKED_BY_IN_PROGRESS",
    );
  });

  it("approved final on subject without mandatory final is rejected", () => {
    assert.equal(checkFinalAllowed({ requiresFinal: false, grade: 8, siblingInProgress: false }), "FINAL_NOT_ALLOWED");
  });

  it("failed final on subject without mandatory final is allowed", () => {
    assert.equal(checkFinalAllowed({ requiresFinal: false, grade: 3, siblingInProgress: false }), null);
  });

  it("regular final is allowed", () => {
    assert.equal(checkFinalAllowed({ requiresFinal: true, grade: 8, siblingInProgress: false }), null);
  });

  it("external free exam is allowed without siblings", () => {
    assert.equal(checkFinalAllowed({ requiresFinal: true, grade: undefined, siblingInProgress: false }), null);
  });
});
