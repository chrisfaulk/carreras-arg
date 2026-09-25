import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { marked } from "marked";

const LEGAL_DIR = join(process.cwd(), "content", "legal");

export function readLegalDoc(slug: string): Promise<string> {
  return readFile(join(LEGAL_DIR, `${slug}.md`), "utf8");
}

export async function renderLegalDoc(slug: string): Promise<string> {
  // ponytail: contenido propio del repo, sin sanitizador. Si acepta aporte externo, agregar sanitize-html.
  const html = await marked.parse(await readLegalDoc(slug));

  return html;
}
