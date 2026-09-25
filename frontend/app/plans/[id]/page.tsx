import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { Search01Icon } from "@hugeicons/core-free-icons";
import Button from "@/components/ui/button";
import EmptyState from "@/components/ui/empty-state";
import Pagination from "@/components/ui/pagination";
import TextField from "@/components/ui/text-field";
import { Container, PageHeader } from "@/components/container";
import { getPlan, getPlanSubjects, getSubjects } from "@/features/catalog/catalog";
import EnrollButton from "@/features/enrollment/enroll-button";
import { getSession } from "@/features/session/get-session";
import { ElectiveLabel, InsufficientBlock, InsufficientSuffix, SubjectBadge } from "@/features/tracking/subject-status";
import { pageNumber } from "@/lib/paged";

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const plan = await getPlan(params.id);

  if (!plan) return { title: "Plan de estudio" };

  return {
    title: `Plan ${plan.year} ${plan.career.name}`,
    description: `Materias del plan ${plan.year} de ${plan.career.name} en Carreras ARG.`,
    alternates: { canonical: `/plans/${params.id}` },
  };
}

export default async function PlanPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { q?: string; page?: string };
}) {
  const plan = await getPlan(params.id);

  if (!plan) notFound();

  const q = searchParams.q ?? "";
  const page = pageNumber(searchParams.page);
  const session = await getSession();
  const tracked = session ? await getPlanSubjects(params.id, q, page) : null;
  const enrolled = tracked !== null;
  const listed = tracked ?? (await getSubjects(params.id, q, page));

  return (
    <main>
      <Container>
        <PageHeader
          eyebrow={
            <>
              <Link
                href={`/universities/${plan.career.university.id}`}
                className="underline-offset-4 hover:text-primary hover:underline"
              >
                {plan.career.university.name}
              </Link>
              {" · "}
              <Link
                href={`/careers/${plan.career.id}`}
                className="underline-offset-4 hover:text-primary hover:underline"
              >
                {plan.career.name}
              </Link>
            </>
          }
          title={`Plan ${plan.year}`}
          sub={`${plan.requiredElectives} electivas requeridas`}
          actions={session && !enrolled ? <EnrollButton planId={params.id} /> : null}
        />

        {!session ? (
          <p className="mb-6">
            <Button variant="ghost" size="sm" href="/login">
              Entrar para ver tu estado
            </Button>
          </p>
        ) : null}

        <form
          method="get"
          action={`/plans/${params.id}`}
          role="search"
          className="mb-6 flex max-w-prose items-end gap-2"
        >
          <TextField
            id="q"
            label="Buscar materia"
            name="q"
            defaultValue={q}
            maxLength={120}
            placeholder="Nombre…"
            className="flex-1"
          />
          <Button variant="primary" type="submit">
            Buscar
          </Button>
        </form>

        {!listed ? (
          <EmptyState
            title="No pudimos cargar"
            hint="Las materias no están disponibles ahora."
            ctaHref={`/plans/${params.id}`}
            ctaLabel="Reintentar"
            icon={<HugeiconsIcon icon={Search01Icon} size={24} />}
          />
        ) : listed.data.length === 0 ? (
          <EmptyState
            title="Sin materias"
            hint={q ? `Nada para "${q}".` : "Este plan todavía no tiene materias."}
            ctaHref={`/plans/${params.id}`}
            ctaLabel="Limpiar búsqueda"
            icon={<HugeiconsIcon icon={Search01Icon} size={24} />}
          />
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full border-y border-border text-left">
                <thead>
                  <tr className="border-b border-border text-sm text-muted">
                    <th scope="col" className="py-2 pr-4 font-medium">
                      Materia
                    </th>
                    <th scope="col" className="py-2 pr-4 font-medium">
                      Tipo
                    </th>
                    {enrolled ? (
                      <th scope="col" className="py-2 font-medium">
                        Estado
                      </th>
                    ) : null}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {listed.data.map((s) => (
                    <tr key={s.id} className="tnum">
                      <td className="py-2.5 pr-4 text-md">
                        {s.name}
                        <InsufficientBlock subject={s} enrolled={enrolled} />
                      </td>
                      <td className="py-2.5 pr-4 text-sm text-muted">
                        <ElectiveLabel subject={s} />
                      </td>
                      {enrolled ? (
                        <td className="py-2.5">
                          <SubjectBadge subject={s} enrolled={enrolled} />
                        </td>
                      ) : null}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <ul className="divide-y divide-border border-y border-border md:hidden">
              {listed.data.map((s) => (
                <li key={s.id} className="grid gap-1 py-3">
                  <span className="flex flex-wrap items-center gap-2 text-md">
                    {s.name}
                    <SubjectBadge subject={s} enrolled={enrolled} />
                  </span>
                  <span className="text-sm text-muted">
                    <ElectiveLabel subject={s} />
                    <InsufficientSuffix subject={s} enrolled={enrolled} />
                  </span>
                </li>
              ))}
            </ul>

            <Pagination
              page={listed.meta.page}
              total={listed.meta.total}
              limit={listed.meta.limit}
              base={`/plans/${params.id}`}
              params={q ? { q } : {}}
            />
          </>
        )}
      </Container>
    </main>
  );
}
