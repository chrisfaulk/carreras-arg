import { clsx as cx } from "clsx";

export function Container({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cx("mx-auto w-full max-w-5xl px-4 md:px-8", className)}>{children}</div>;
}

export function PageHeader({
  eyebrow,
  title,
  sub,
  actions,
  className,
}: {
  eyebrow?: React.ReactNode;
  title: string;
  sub?: string;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cx("grid gap-2 py-8 md:py-12", className)}>
      {eyebrow ? <p className="text-sm font-medium text-accent">{eyebrow}</p> : null}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="max-w-prose text-xl font-semibold tracking-tight md:text-display md:leading-none">{title}</h1>
        {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
      </div>
      {sub ? <p className="max-w-prose text-md leading-7 text-muted">{sub}</p> : null}
    </div>
  );
}
