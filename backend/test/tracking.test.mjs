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

const { visibleStatus, insufficientCorrelatives } = await import("../dist/modules/tracking/availability-reader.js");

const { closeAttempt } = await import("../dist/modules/tracking/attempt-closer.js");

const { calculateAverages } = await import("../dist/modules/tracking/average-calculator.js");

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

describe("availability reader", () => {
  it("no attempts and no correlatives is AVAILABLE", () => {
    assert.equal(visibleStatus([], [], "s1"), "AVAILABLE");
  });

  it("unmet PREVIOUS is NOT_AVAILABLE", () => {
    assert.equal(visibleStatus([], [{ correlativeSubjectId: "s0", type: "PREVIOUS" }], "s1"), "NOT_AVAILABLE");
  });

  it("PENDING_FINAL satisfies PREVIOUS", () => {
    assert.equal(
      visibleStatus(
        [{ subjectId: "s0", status: "PENDING_FINAL" }],
        [{ correlativeSubjectId: "s0", type: "PREVIOUS" }],
        "s1",
      ),
      "AVAILABLE",
    );
  });

  it("IN_PROGRESS does not satisfy PREVIOUS", () => {
    assert.equal(
      visibleStatus(
        [{ subjectId: "s0", status: "IN_PROGRESS" }],
        [{ correlativeSubjectId: "s0", type: "PREVIOUS" }],
        "s1",
      ),
      "NOT_AVAILABLE",
    );
  });

  it("IN_PROGRESS satisfies CONCURRENT", () => {
    assert.equal(
      visibleStatus(
        [{ subjectId: "s0", status: "IN_PROGRESS" }],
        [{ correlativeSubjectId: "s0", type: "CONCURRENT" }],
        "s1",
      ),
      "AVAILABLE",
    );
  });

  it("FAILED correlative does not satisfy", () => {
    assert.equal(
      visibleStatus(
        [{ subjectId: "s0", status: "FAILED" }],
        [{ correlativeSubjectId: "s0", type: "CONCURRENT" }],
        "s1",
      ),
      "NOT_AVAILABLE",
    );
  });

  it("FAILED own resolves back to AVAILABLE", () => {
    assert.equal(visibleStatus([{ subjectId: "s1", status: "FAILED" }], [], "s1"), "AVAILABLE");
  });

  it("priority PASSED over IN_PROGRESS over PENDING_FINAL", () => {
    const attempts = [
      { subjectId: "s1", status: "PENDING_FINAL" },
      { subjectId: "s1", status: "IN_PROGRESS" },
    ];

    assert.equal(visibleStatus(attempts, [], "s1"), "IN_PROGRESS");

    assert.equal(visibleStatus([...attempts, { subjectId: "s1", status: "PASSED" }], [], "s1"), "PASSED");
  });

  it("flags insufficient when concurrent dropped mid-course", () => {
    const attempts = [
      { subjectId: "s1", status: "IN_PROGRESS" },
      { subjectId: "s0", status: "FAILED" },
    ];

    assert.equal(insufficientCorrelatives(attempts, [{ correlativeSubjectId: "s0", type: "CONCURRENT" }], "s1"), true);
  });

  it("no flag when correlatives hold or subject passed", () => {
    const ok = [
      { subjectId: "s1", status: "IN_PROGRESS" },
      { subjectId: "s0", status: "IN_PROGRESS" },
    ];

    assert.equal(insufficientCorrelatives(ok, [{ correlativeSubjectId: "s0", type: "CONCURRENT" }], "s1"), false);

    const passed = [
      { subjectId: "s1", status: "PASSED" },
      { subjectId: "s0", status: "FAILED" },
    ];

    assert.equal(insufficientCorrelatives(passed, [{ correlativeSubjectId: "s0", type: "CONCURRENT" }], "s1"), false);
  });
});

describe("attempt closer", () => {
  it("7,7 without final is PASSED", () => {
    assert.deepEqual(closeAttempt({ effectiveGrades: [7, 7], minRegularize: 4, minPromote: 7, requiresFinal: false }), {
      status: "PASSED",
      finalGrade: 7,
      average: 7,
    });
  });

  it("4,4 with final is PENDING_FINAL", () => {
    assert.deepEqual(closeAttempt({ effectiveGrades: [4, 4], minRegularize: 4, minPromote: 7, requiresFinal: true }), {
      status: "PENDING_FINAL",
      finalGrade: 4,
      average: 4,
    });
  });

  it("3,3 is FAILED", () => {
    assert.deepEqual(closeAttempt({ effectiveGrades: [3, 3], minRegularize: 4, minPromote: 7, requiresFinal: true }), {
      status: "FAILED",
      finalGrade: 3,
      average: 3,
    });
  });

  it("rounds half up against thresholds (6,7 promotes)", () => {
    assert.deepEqual(closeAttempt({ effectiveGrades: [6, 7], minRegularize: 4, minPromote: 7, requiresFinal: false }), {
      status: "PASSED",
      finalGrade: 7,
      average: 6.5,
    });
  });

  it("rounds half down below (5,6 regularizes)", () => {
    assert.deepEqual(closeAttempt({ effectiveGrades: [5, 6], minRegularize: 4, minPromote: 7, requiresFinal: false }), {
      status: "PENDING_FINAL",
      finalGrade: 6,
      average: 5.5,
    });
  });

  it("null instance blocks close", () => {
    assert.deepEqual(
      closeAttempt({ effectiveGrades: [7, null], minRegularize: 4, minPromote: 7, requiresFinal: false }),
      { error: "INCOMPLETE_INSTANCES" },
    );
  });

  it("zero instances block close", () => {
    assert.deepEqual(closeAttempt({ effectiveGrades: [], minRegularize: 4, minPromote: 7, requiresFinal: false }), {
      error: "INCOMPLETE_INSTANCES",
    });
  });

  it("custom thresholds apply (8,8 with promote 9 is PENDING_FINAL)", () => {
    assert.deepEqual(closeAttempt({ effectiveGrades: [8, 8], minRegularize: 4, minPromote: 9, requiresFinal: false }), {
      status: "PENDING_FINAL",
      finalGrade: 8,
      average: 8,
    });
  });
});

describe("average calculator", () => {
  const subjects = [
    { id: "s1", isElective: false },
    { id: "s2", isElective: false },
    { id: "e1", isElective: true },
  ];

  it("average uses only passed grades, progress counts plan", () => {
    assert.deepEqual(
      calculateAverages({
        subjects,
        attempts: [{ subjectId: "s1", status: "PASSED", finalGrade: 8, annulled: false, finals: [] }],
        requiredElectives: 1,
      }),
      { average: 8, averageWithFailures: 8, progress: 1 / 3 },
    );
  });

  it("approved final overrides course grade", () => {
    assert.deepEqual(
      calculateAverages({
        subjects,
        attempts: [{ subjectId: "s1", status: "PASSED", finalGrade: 7, annulled: false, finals: [6] }],
        requiredElectives: 0,
      }),
      { average: 6, averageWithFailures: 6, progress: 0.5 },
    );
  });

  it("failures drag average_with_failures only", () => {
    assert.deepEqual(
      calculateAverages({
        subjects,
        attempts: [
          { subjectId: "s1", status: "PASSED", finalGrade: 8, annulled: false, finals: [] },
          { subjectId: "s2", status: "FAILED", finalGrade: 3, annulled: false, finals: [] },
          { subjectId: "s2", status: "PENDING_FINAL", finalGrade: null, annulled: false, finals: [2] },
        ],
        requiredElectives: 0,
      }),
      { average: 8, averageWithFailures: (8 + 3 + 2) / 3, progress: 0.5 },
    );
  });

  it("annulled attempts are ignored everywhere", () => {
    assert.deepEqual(
      calculateAverages({
        subjects,
        attempts: [
          { subjectId: "s1", status: "PENDING_FINAL", finalGrade: null, annulled: true, finals: [] },
          { subjectId: "s1", status: "PASSED", finalGrade: 9, annulled: false, finals: [] },
        ],
        requiredElectives: 0,
      }),
      { average: 9, averageWithFailures: 9, progress: 0.5 },
    );
  });

  it("electives cap at required_electives for progress", () => {
    const many = [...subjects, { id: "e2", isElective: true }];

    assert.deepEqual(
      calculateAverages({
        subjects: many,
        attempts: [
          { subjectId: "s1", status: "PASSED", finalGrade: 7, annulled: false, finals: [] },
          { subjectId: "s2", status: "PASSED", finalGrade: 7, annulled: false, finals: [] },
          { subjectId: "e1", status: "PASSED", finalGrade: 9, annulled: false, finals: [] },
          { subjectId: "e2", status: "PASSED", finalGrade: 9, annulled: false, finals: [] },
        ],
        requiredElectives: 1,
      }),
      { average: 8, averageWithFailures: 8, progress: 1 },
    );
  });

  it("empty enrollment has null averages and zero progress", () => {
    assert.deepEqual(calculateAverages({ subjects, attempts: [], requiredElectives: 1 }), {
      average: null,
      averageWithFailures: null,
      progress: 0,
    });
  });
});
