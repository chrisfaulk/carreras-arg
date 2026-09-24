export type PersistedStatus = "IN_PROGRESS" | "PENDING_FINAL" | "PASSED" | "FAILED";

export type TargetStatus = PersistedStatus | "AVAILABLE" | "NOT_AVAILABLE";

export type TransitionError = "INVALID_TRANSITION" | "FINAL_EXAM_REQUIRED" | "GRADE_REQUIRED" | "GRADE_BELOW_PROMOTE";

export interface TransitionInput {
  from: PersistedStatus;
  to: TargetStatus;
  requiresFinal: boolean;
  minPromote: number;
  hasApprovedFinal: boolean;
  finalGrade?: number;
}

export function checkTransition(input: TransitionInput): TransitionError | null {
  if (input.to === "AVAILABLE" || input.to === "NOT_AVAILABLE" || input.to === "FAILED") return "INVALID_TRANSITION";

  if (input.from === "FAILED") return "INVALID_TRANSITION";

  if (input.from === input.to) return null;

  if (input.to === "PASSED") {
    if (input.requiresFinal) {
      if (!input.hasApprovedFinal) return "FINAL_EXAM_REQUIRED";
    } else {
      if (input.finalGrade === undefined) return "GRADE_REQUIRED";

      if (input.finalGrade < input.minPromote) return "GRADE_BELOW_PROMOTE";
    }
  }

  return null;
}
