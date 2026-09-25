import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight01Icon, BookOpen01Icon } from "@hugeicons/core-free-icons";
import Button from "@/components/ui/button";
import EmptyState from "@/components/ui/empty-state";
import Pagination from "@/components/ui/pagination";
import { getCareersWithPlans, getUniversities } from "@/features/catalog/catalog";
import { pageNumber } from "@/lib/paged";

export interface CatalogQuery {
  universityId: string;
  page: number;
}

export function catalogParams(searchParams: { universityId?: string; page?: string }): CatalogQuery {
  return { universityId: searchParams.universityId ?? "", page: pageNumber(searchParams.page) };
}

export default async function CatalogBrowser({
  universityId,
  page,
  base,
  className,
}: {
  universityId: string;
  page: number;
  base: string;
  className?: string;
}) {
  const [universities, careers] = await Promise.all([getUniversities("", 1), getCareersWithPlans(universityId, page)]);

  return (
    <div className={className}>
      <form method="get" action={base} className="mb-6 flex max-w-prose items-end gap-2">
        <div className="grid flex-1 gap-1.5">
          <label className="text-sm font-medium" htmlFor="universityId">
            Universidad
          </label>
          <select
            id="universityId"
            name="universityId"
            defaultValue={universityId}
            className="w-full max-w-full rounded-full border border-border bg-surface px-3 py-2 text-md focus:border-primary"
          >
            <option value="">Todas</option>
            {(universities?.data ?? []).map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
        </div>
        <Button variant="primary" type="submit">
          Filtrar
        </Button>
      </form>

      {!careers ? (
        <EmptyState
          title="No pudimos cargar"
          hint="El catálogo no está disponible ahora."
          ctaHref={base}
          ctaLabel="Reintentar"
          icon={<HugeiconsIcon icon={BookOpen01Icon} size={24} />}
        />
      ) : careers.data.length === 0 ? (
        <EmptyState
          title="Sin carreras"
          hint={universityId ? "Nada para esta universidad." : "Todavía no hay carreras."}
          ctaHref={base}
          ctaLabel="Limpiar filtro"
          icon={<HugeiconsIcon icon={BookOpen01Icon} size={24} />}
        />
      ) : (
        <>
          <ul className="divide-y divide-border border-y border-border">
            {careers.data.map((c) => (
              <li key={c.id} className="grid gap-1.5 py-3">
                <span className="flex flex-wrap items-baseline gap-x-3">
                  <Link href={`/careers/${c.id}`} className="text-md font-medium hover:text-primary">
                    {c.name}
                  </Link>
                  <span className="text-sm text-muted">{c.university.name}</span>
                </span>
                {c.plans.length > 0 ? (
                  <span className="flex flex-wrap gap-1.5">
                    {c.plans.map((p) => (
                      <Link
                        key={p.id}
                        href={`/plans/${p.id}`}
                        className="tnum rounded-full border border-border px-2 py-0.5 text-xs text-muted transition-colors hover:border-primary hover:text-primary"
                      >
                        Plan {p.year}
                      </Link>
                    ))}
                  </span>
                ) : null}
              </li>
            ))}
          </ul>

          <Pagination
            page={careers.meta.page}
            total={careers.meta.total}
            limit={careers.meta.limit}
            base={base}
            params={universityId ? { universityId } : {}}
          />
        </>
      )}

      <p className="mt-6">
        <Link
          href={universityId ? `/universities/${universityId}` : "/universities"}
          className="inline-flex items-center gap-1 text-sm text-muted underline-offset-4 hover:text-primary hover:underline"
        >
          Explorar por universidad
          <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
        </Link>
      </p>
    </div>
  );
}
