import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight01Icon, BookOpen01Icon } from "@hugeicons/core-free-icons";
import EmptyState from "@/components/ui/empty-state";
import Pagination from "@/components/ui/pagination";
import { Container, PageHeader } from "@/components/container";
import { getCareer, getPlans } from "@/features/catalog/catalog";

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const career = await getCareer(params.id);

  if (!career) return { title: "Carrera" };

  return {
    title: career.name,
    description: `Planes de estudio de ${career.name} en Carreras ARG.`,
    alternates: { canonical: `/careers/${params.id}` },
  };
}

export default async function CareerPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { page?: string };
}) {
  const career = await getCareer(params.id);

  if (!career) notFound();

  const raw = Number(searchParams.page ?? "1");
  const page = Number.isInteger(raw) && raw > 0 ? raw : 1;
  const plans = await getPlans(params.id, page);

  return (
    <main>
      <Container>
        <PageHeader
          eyebrow={
            <Link
              href={`/universities/${career.university.id}`}
              className="underline-offset-4 hover:text-fg hover:underline"
            >
              {career.university.name}
            </Link>
          }
          title={career.name}
          sub="Elegí tu plan de estudio para ver sus materias."
        />

        {!plans ? (
          <EmptyState
            title="No pudimos cargar"
            hint="Los planes no están disponibles ahora."
            ctaHref={`/careers/${params.id}`}
            ctaLabel="Reintentar"
            icon={<HugeiconsIcon icon={BookOpen01Icon} size={24} />}
          />
        ) : plans.data.length === 0 ? (
          <EmptyState
            title="Sin planes"
            hint="Esta carrera todavía no tiene planes cargados."
            ctaHref={`/universities/${career.university.id}`}
            ctaLabel="Ver carreras"
            icon={<HugeiconsIcon icon={BookOpen01Icon} size={24} />}
          />
        ) : (
          <>
            <ul className="divide-y divide-border border-y border-border">
              {plans.data.map((p) => (
                <li key={p.id}>
                  <Link href={`/plans/${p.id}`} className="group flex items-center justify-between gap-4 py-3">
                    <span className="tnum text-md">Plan {p.year}</span>
                    <span className="flex shrink-0 items-center gap-3">
                      <span className="text-sm text-muted">{p.requiredElectives} electivas</span>
                      <HugeiconsIcon
                        icon={ArrowRight01Icon}
                        size={16}
                        className="text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-fg"
                      />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>

            <Pagination
              page={plans.meta.page}
              total={plans.meta.total}
              limit={plans.meta.limit}
              base={`/careers/${params.id}`}
              params={{}}
            />
          </>
        )}
      </Container>
    </main>
  );
}
