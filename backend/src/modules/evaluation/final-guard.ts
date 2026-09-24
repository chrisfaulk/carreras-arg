export type FinalGuardError = "FINAL_BLOCKED_BY_IN_PROGRESS" | "FINAL_NOT_ALLOWED";

export interface FinalGuardInput {
  requiresFinal: boolean;
  grade?: number | null;
  siblingInProgress: boolean;
}

export function checkFinalAllowed(input: FinalGuardInput): FinalGuardError | null {
  if (input.siblingInProgress) return "FINAL_BLOCKED_BY_IN_PROGRESS";

  if (!input.requiresFinal && (input.grade ?? 0) >= 4) return "FINAL_NOT_ALLOWED";

  return null;
}
