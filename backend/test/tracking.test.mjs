import { describe, it } from "node:test";
import assert from "node:assert/strict";

process.env.DATABASE_URL ??= "postgres://localhost:5432/test";

process.env.JWT_SECRET ??= "test-secret-1234567890";

process.env.GOOGLE_CLIENT_ID ??= "test";

process.env.GOOGLE_CLIENT_SECRET ??= "test";

process.env.RESEND_API_KEY ??= "test";

process.env.NEXT_PUBLIC_API_URL ??= "http://localhost:3001";

process.env.ADMIN_SEED_EMAIL ??= "admin@example.com";

const { checkTransition } = await import("../dist/modules/tracking/attempt-machine.js");

describe("attempt machine", () => {
  it("rejects manual move to AVAILABLE", () => {
    assert.equal(
      checkTransition({
        from: "IN_PROGRESS",
        to: "AVAILABLE",
        requiresFinal: false,
        minPromote: 7,
        hasApprovedFinal: false,
      }),
      "INVALID_TRANSITION",
    );
  });

  it("rejects manual move to FAILED", () => {
    assert.equal(
      checkTransition({
        from: "IN_PROGRESS",
        to: "FAILED",
        requiresFinal: false,
        minPromote: 7,
        hasApprovedFinal: false,
        finalGrade: 3,
      }),
      "INVALID_TRANSITION",
    );
  });

  it("idempotent repeat returns null", () => {
    assert.equal(
      checkTransition({
        from: "PENDING_FINAL",
        to: "PENDING_FINAL",
        requiresFinal: true,
        minPromote: 7,
        hasApprovedFinal: false,
      }),
      null,
    );
  });

  it("IN_PROGRESS to PASSED without final needs grade", () => {
    assert.equal(
      checkTransition({
        from: "IN_PROGRESS",
        to: "PASSED",
        requiresFinal: false,
        minPromote: 7,
        hasApprovedFinal: false,
      }),
      "GRADE_REQUIRED",
    );
  });

  it("IN_PROGRESS to PASSED rejects grade below promote", () => {
    assert.equal(
      checkTransition({
        from: "IN_PROGRESS",
        to: "PASSED",
        requiresFinal: false,
        minPromote: 7,
        hasApprovedFinal: false,
        finalGrade: 6,
      }),
      "GRADE_BELOW_PROMOTE",
    );
  });

  it("IN_PROGRESS to PASSED with promoting grade passes", () => {
    assert.equal(
      checkTransition({
        from: "IN_PROGRESS",
        to: "PASSED",
        requiresFinal: false,
        minPromote: 7,
        hasApprovedFinal: false,
        finalGrade: 8,
      }),
      null,
    );
  });

  it("PENDING_FINAL to PASSED needs approved final when requiresFinal", () => {
    assert.equal(
      checkTransition({
        from: "PENDING_FINAL",
        to: "PASSED",
        requiresFinal: true,
        minPromote: 7,
        hasApprovedFinal: false,
      }),
      "FINAL_EXAM_REQUIRED",
    );
  });

  it("PENDING_FINAL to PASSED with approved final passes", () => {
    assert.equal(
      checkTransition({
        from: "PENDING_FINAL",
        to: "PASSED",
        requiresFinal: true,
        minPromote: 7,
        hasApprovedFinal: true,
      }),
      null,
    );
  });

  it("FAILED is terminal", () => {
    assert.equal(
      checkTransition({
        from: "FAILED",
        to: "IN_PROGRESS",
        requiresFinal: false,
        minPromote: 7,
        hasApprovedFinal: false,
      }),
      "INVALID_TRANSITION",
    );
  });

  it("free move between IN_PROGRESS and PENDING_FINAL", () => {
    assert.equal(
      checkTransition({
        from: "IN_PROGRESS",
        to: "PENDING_FINAL",
        requiresFinal: true,
        minPromote: 7,
        hasApprovedFinal: false,
      }),
      null,
    );
  });
});
