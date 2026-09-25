export interface CorrelativeEdge {
  subjectId: string;
  correlativeSubjectId: string;
}

export function buildAdj(edges: CorrelativeEdge[]): Map<string, string[]> {
  const adj = new Map<string, string[]>();

  for (const edge of edges) {
    const current = adj.get(edge.subjectId);

    if (current) current.push(edge.correlativeSubjectId);
    else adj.set(edge.subjectId, [edge.correlativeSubjectId]);
  }

  return adj;
}

export function hasPath(adj: Map<string, string[]>, from: string, target: string): boolean {
  const seen = new Set<string>([from]);
  const queue = [from];

  while (queue.length > 0) {
    const cur = queue.shift()!;

    if (cur === target) return true;

    for (const next of adj.get(cur) ?? []) {
      if (next === target) return true;

      if (!seen.has(next)) {
        seen.add(next);
        queue.push(next);
      }
    }
  }

  return false;
}
