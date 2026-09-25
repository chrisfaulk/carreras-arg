import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight01Icon, Search01Icon } from "@hugeicons/core-free-icons";
import Button from "@/components/ui/button";
import EmptyState from "@/components/ui/empty-state";
import Pagination from "@/components/ui/pagination";
import TextField from "@/components/ui/text-field";
import { Container, PageHeader } from "@/components/container";
import { getUniversities } from "@/features/catalog/catalog";

export const metadata = {
  title: "Universidades",
  description: "Explorá universidades argentinas y sus carreras en Carreras ARG.",
  alternates: { canonical: "/universities" },
};

function pageNumber(raw: string | undefined): number {
  const page = Number(raw ?? "1");

  return Number.isInteger(page) && page > 0 ? page : 1;
}

export default async function UniversitiesPage({ searchParams }: { searchParams: { q?: string; page?: string } }) {
  const q = searchParams.q ?? "";
  const page = pageNumber(searchParams.page);
  const result = await getUniversities(q, page);

  return (
    <main>
      <Container>
        <PageHeader title="Universidades" sub="Explorá el catálogo público por nombre." />

        <form method="get" action="/universities" role="search" className="mb-6 flex max-w-prose items-end gap-2">
          <TextField
            id="q"
            label="Buscar"
            name="q"
            defaultValue={q}
            maxLength={120}
            placeholder="UBA, UNC…"
            className="flex-1"
          />
          <Button variant="primary" type="submit">
            Buscar
          </Button>
        </form>

        {!result ? (
          <EmptyState
            title="No pudimos cargar"
            hint="El catálogo no está disponible ahora."
            ctaHref="/universities"
            ctaLabel="Reintentar"
            icon={<HugeiconsIcon icon={Search01Icon} size={24} />}
          />
        ) : result.data.length === 0 ? (
          <EmptyState
            title="Sin resultados"
            hint={q ? `Nada para "${q}".` : "Todavía no hay universidades."}
            ctaHref="/universities"
            ctaLabel="Limpiar búsqueda"
            icon={<HugeiconsIcon icon={Search01Icon} size={24} />}
          />
        ) : (
          <>
            <ul className="divide-y divide-border border-y border-border">
              {result.data.map((u) => (
                <li key={u.id}>
                  <Link
                    href={`/universities/${u.id}`}
                    className="group flex items-center justify-between gap-4 py-3 text-md transition-colors"
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

            <Pagination
              page={result.meta.page}
              total={result.meta.total}
              limit={result.meta.limit}
              base="/universities"
              params={q ? { q } : {}}
            />
          </>
        )}
      </Container>
    </main>
  );
}
