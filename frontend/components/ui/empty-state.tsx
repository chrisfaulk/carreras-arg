import { clsx as cx } from "clsx";
import Button from "./button";

export default function EmptyState({
  title,
  hint,
  ctaHref,
  ctaLabel,
  icon,
  className,
}: {
  title: string;
  hint: string;
  ctaHref: string;
  ctaLabel: string;
  icon?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cx("mx-auto grid max-w-prose gap-3 py-12 text-center", className)}>
      {icon ? <div className="mx-auto text-muted">{icon}</div> : null}
      <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
      <p className="text-md text-muted">{hint}</p>
      <p>
        <Button variant="secondary" size="sm" href={ctaHref}>
          {ctaLabel}
        </Button>
      </p>
    </div>
  );
}
