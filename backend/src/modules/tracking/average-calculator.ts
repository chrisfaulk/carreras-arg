export interface SubjectRow {
  id: string;
  isElective: boolean;
}

export interface AttemptRow {
  subjectId: string;
  status: string;
  finalGrade: number | null;
  annulled: boolean;
  finals: Array<number | null>;
}

export interface AverageInput {
  subjects: SubjectRow[];
  attempts: AttemptRow[];
  requiredElectives: number;
}

export interface AverageOutput {
  average: number | null;
  averageWithFailures: number | null;
  progress: number;
}

function mean(grades: number[]): number | null {
  if (grades.length === 0) return null;

  let sum = 0;

  for (const grade of grades) sum += grade;

  return sum / grades.length;
}

export function calculateAverages(input: AverageInput): AverageOutput {
  const live = input.attempts.filter((attempt) => !attempt.annulled);
  const approved = new Map<string, number[]>();
  const failures: number[] = [];

  for (const attempt of live) {
    for (const grade of attempt.finals) {
      if (grade !== null && grade < 4) failures.push(grade);
    }

    if (attempt.status === "FAILED") {
      if (attempt.finalGrade !== null) failures.push(attempt.finalGrade);

      continue;
    }

    if (attempt.status !== "PASSED") continue;

    const passedFinals = attempt.finals.filter((grade): grade is number => grade !== null && grade >= 4);
    const grade = passedFinals.length > 0 ? Math.max(...passedFinals) : attempt.finalGrade;

    if (grade === null || grade === undefined) continue;

    const current = approved.get(attempt.subjectId);

    if (current) current.push(grade);
    else approved.set(attempt.subjectId, [grade]);
  }

  const approvedGrades = [...approved.values()].map((grades) => Math.max(...grades));
  const withFailures = [...approvedGrades, ...failures];
  const electives = new Set(input.subjects.filter((subject) => subject.isElective).map((subject) => subject.id));

  let obligatory = 0;
  let obligatoryPassed = 0;
  let electivesPassed = 0;

  for (const subject of input.subjects) {
    const passed = approved.has(subject.id);

    if (electives.has(subject.id)) {
      if (passed) electivesPassed += 1;
    } else {
      obligatory += 1;

      if (passed) obligatoryPassed += 1;
    }
  }

  const total = obligatory + input.requiredElectives;

  return {
    average: mean(approvedGrades),
    averageWithFailures: mean(withFailures),
    progress: total === 0 ? 1 : (obligatoryPassed + Math.min(electivesPassed, input.requiredElectives)) / total,
  };
}
