export type VisibleStatus = "NOT_AVAILABLE" | "AVAILABLE" | "PENDING_FINAL" | "IN_PROGRESS" | "PASSED";

export interface AttemptRow {
  subjectId: string;
  status: string;
}

export interface CorrelativeRow {
  correlativeSubjectId: string;
  type: "PREVIOUS" | "CONCURRENT";
}

const PREVIOUS_OK = new Set(["PASSED", "PENDING_FINAL"]);

const CONCURRENT_OK = new Set(["PASSED", "PENDING_FINAL", "IN_PROGRESS"]);

function aggregate(attempts: AttemptRow[]): Map<string, Set<string>> {
  const bySubject = new Map<string, Set<string>>();

  for (const attempt of attempts) {
    if (attempt.status === "FAILED") continue;

    const current = bySubject.get(attempt.subjectId);

    if (current) current.add(attempt.status);
    else bySubject.set(attempt.subjectId, new Set([attempt.status]));
  }

  return bySubject;
}

function correlativesMet(bySubject: Map<string, Set<string>>, correlatives: CorrelativeRow[]): boolean {
  return correlatives.every((correlative) => {
    const statuses = bySubject.get(correlative.correlativeSubjectId);

    if (!statuses) return false;

    const ok = correlative.type === "PREVIOUS" ? PREVIOUS_OK : CONCURRENT_OK;

    for (const status of statuses) if (ok.has(status)) return true;

    return false;
  });
}

export function visibleStatus(
  attempts: AttemptRow[],
  correlatives: CorrelativeRow[],
  subjectId: string,
): VisibleStatus {
  const bySubject = aggregate(attempts);
  const own = bySubject.get(subjectId);

  if (own?.has("PASSED")) return "PASSED";

  if (own?.has("IN_PROGRESS")) return "IN_PROGRESS";

  if (own?.has("PENDING_FINAL")) return "PENDING_FINAL";

  return correlativesMet(bySubject, correlatives) ? "AVAILABLE" : "NOT_AVAILABLE";
}

export function insufficientCorrelatives(
  attempts: AttemptRow[],
  correlatives: CorrelativeRow[],
  subjectId: string,
): boolean {
  const visible = visibleStatus(attempts, correlatives, subjectId);

  if (visible !== "IN_PROGRESS" && visible !== "PENDING_FINAL") return false;

  return !correlativesMet(aggregate(attempts), correlatives);
}
