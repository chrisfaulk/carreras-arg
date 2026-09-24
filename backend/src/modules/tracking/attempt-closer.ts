export type CloseStatus = "PASSED" | "PENDING_FINAL" | "FAILED";

export interface CloseInput {
  effectiveGrades: Array<number | null>;
  minRegularize: number;
  minPromote: number;
  requiresFinal: boolean;
}

export interface CloseOutput {
  status: CloseStatus;
  finalGrade: number;
  average: number;
}

export interface CloseIncomplete {
  error: "INCOMPLETE_INSTANCES";
}

export function closeAttempt(input: CloseInput): CloseOutput | CloseIncomplete {
  if (input.effectiveGrades.length === 0) return { error: "INCOMPLETE_INSTANCES" };

  let sum = 0;

  for (const grade of input.effectiveGrades) {
    if (grade === null) return { error: "INCOMPLETE_INSTANCES" };

    sum += grade;
  }

  const average = sum / input.effectiveGrades.length;
  const finalGrade = Math.floor(average + 0.5);

  if (finalGrade >= input.minPromote)
    return { status: input.requiresFinal ? "PENDING_FINAL" : "PASSED", finalGrade, average };

  if (finalGrade >= input.minRegularize) return { status: "PENDING_FINAL", finalGrade, average };

  return { status: "FAILED", finalGrade, average };
}
