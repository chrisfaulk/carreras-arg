import { copyFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const from = join(root, ".docs", "legal");

const to = join(root, "frontend", "content", "legal");

await mkdir(to, { recursive: true });

const files = ["privacy.md", "terms.md", "cookies.md"];

for (const f of files) await copyFile(join(from, f), join(to, f));

console.log(`[sync-legal] ${files.length} docs -> frontend/content/legal/`);
