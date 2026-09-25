import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight01Icon } from "@hugeicons/core-free-icons";
import Button from "@/components/ui/button";
import { Container, PageHeader } from "@/components/container";
import { getUniversities } from "@/features/catalog/catalog";

export default async function Home() {
  const result = await getUniversities("", 1);
  const top = result?.data.slice(0, 10) ?? [];

  return (
    <main>
      <Container>
        <PageHeader
          title="Seguí tu carrera, materia por materia"
          sub="Anotate a tu plan de estudio y descubrí qué materias podés cursar según correlativas."
          actions={
            <Button variant="primary" href="/universities">
              Buscar universidades
            </Button>
          }
        />

        {top.length > 0 ? (
          <section aria-labelledby="unis" className="pb-12">
            <div className="mb-2 flex items-baseline justify-between">
              <h2 id="unis" className="text-md font-semibold tracking-tight">
                Universidades
              </h2>
              <Link
                href="/universities"
                className="text-sm text-muted underline-offset-4 hover:text-primary hover:underline"
              >
                Ver todas
              </Link>
            </div>
            <ul className="divide-y divide-border border-y border-border">
              {top.map((u) => (
                <li key={u.id}>
                  <Link
                    href={`/universities/${u.id}`}
                    className="group flex items-center justify-between gap-4 py-3 text-md transition-colors hover:text-primary"
                  >
                    <span className="truncate">{u.name}</span>
                    <HugeiconsIcon
                      icon={ArrowRight01Icon}
                      size={16}
                      className="shrink-0 text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-primary"
                    />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </Container>
    </main>
  );
}
