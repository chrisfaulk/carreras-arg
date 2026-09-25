export function pageNumber(raw: string | undefined): number {
  const page = Number(raw ?? "1");

  return Number.isInteger(page) && page > 0 ? page : 1;
}
