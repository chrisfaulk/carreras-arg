import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight01Icon, BookOpen01Icon } from "@hugeicons/core-free-icons";
import EmptyState from "@/components/ui/empty-state";
import Pagination from "@/components/ui/pagination";
import { Container, PageHeader } from "@/components/container";
import { getCareers, getUniversity } from "@/features/catalog/catalog";

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const uni = await getUniversity(params.id);

  if (!uni) return { title: "Universidad" };

  return {
    title: uni.name,
    description: `Carreras de ${uni.name} en Carreras ARG.`,
    alternates: { canonical: `/universities/${params.id}` },
  };
}

export default async function UniversityPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { page?: string };
}) {
  const uni = await getUniversity(params.id);

  if (!uni) notFound();

  const raw = Number(searchParams.page ?? "1");
  const page = Number.isInteger(raw) && raw > 0 ? raw : 1;
  const careers = await getCareers(params.id, page);

  return (
    <main>
      <Container>
        <PageHeader
          eyebrow={
            <Link href="/universities" className="underline-offset-4 hover:text-primary hover:underline">
              Universidades
            </Link>
          }
          title={uni.name}
        />

        {!careers ? (
          <EmptyState
            title="No pudimos cargar"
            hint="Las carreras no están disponibles ahora."
            ctaHref={`/universities/${params.id}`}
            ctaLabel="Reintentar"
            icon={<HugeiconsIcon icon={BookOpen01Icon} size={24} />}
          />
        ) : careers.data.length === 0 ? (
          <EmptyState
            title="Sin carreras"
            hint="Esta universidad todavía no tiene carreras cargadas."
            ctaHref="/universities"
            ctaLabel="Ver universidades"
            icon={<HugeiconsIcon icon={BookOpen01Icon} size={24} />}
          />
        ) : (
          <>
            <ul className="divide-y divide-border border-y border-border">
              {careers.data.map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/careers/${c.id}`}
                    className="group flex items-center justify-between gap-4 py-3 text-md"
                  >
                    <span className="truncate">{c.name}</span>
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
              page={careers.meta.page}
              total={careers.meta.total}
              limit={careers.meta.limit}
              base={`/universities/${params.id}`}
              params={{}}
            />
          </>
        )}
      </Container>
    </main>
  );
}
