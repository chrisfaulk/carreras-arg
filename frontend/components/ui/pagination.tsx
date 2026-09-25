import Link from "next/link";
import { clsx as cx } from "clsx";

export default function Pagination({
  page,
  total,
  limit,
  base,
  params,
  className,
}: {
  page: number;
  total: number;
  limit: number;
  base: string;
  params: Record<string, string>;
  className?: string;
}) {
  const totalPages = Math.max(1, Math.ceil(total / limit));

  function href(next: number): string {
    const query = new URLSearchParams({ ...params, page: String(next) });

    return `${base}?${query.toString()}`;
  }

  const link = cx(
    "rounded-full border border-border bg-surface px-3 py-1.5 text-sm font-medium transition-colors hover:border-fg",
  );

  return (
    <nav
      aria-label="Paginación"
      className={cx(
        "sticky bottom-2 mt-8 flex items-center justify-between gap-4 rounded-full border border-border bg-surface px-4 py-2 shadow-sm backdrop-blur md:static md:rounded-none md:border-0 md:bg-transparent md:p-0 md:shadow-none md:backdrop-blur-0",
        className,
      )}
    >
      <p className="tnum text-sm text-muted">
        Página {page} de {totalPages}
      </p>
      <p className="flex gap-2">
        {page > 1 ? (
          <Link href={href(page - 1)} className={link}>
            Anterior
          </Link>
        ) : null}
        {page < totalPages ? (
          <Link href={href(page + 1)} className={link}>
            Siguiente
          </Link>
        ) : null}
      </p>
    </nav>
  );
}
