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
