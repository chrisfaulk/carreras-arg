import { readFile } from "node:fs/promises";
import { join } from "node:path";

const LEGAL_DIR = join(process.cwd(), "..", ".docs", "legal");

export function readLegalDoc(slug: string): Promise<string> {
  return readFile(join(LEGAL_DIR, `${slug}.md`), "utf8");
}
