import { BookOpen01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

export default function Home() {
  return (
    <main className="p-8">
      <HugeiconsIcon icon={BookOpen01Icon} />
      <h1 className="text-lg">Carreras ARG</h1>
      <p className="text-sm text-muted">Seguimiento de materias y correlativas.</p>
    </main>
  );
}
