export function effectiveGrade(grade: number | null, retakes: number[]): number | null {
  const scored = retakes.filter((retake) => retake !== null);

  if (grade !== null) scored.push(grade);

  return scored.length > 0 ? Math.max(...scored) : null;
}
