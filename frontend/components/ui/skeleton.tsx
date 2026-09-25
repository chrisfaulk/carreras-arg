import { clsx as cx } from "clsx";

export default function Skeleton({
  label,
  lines = 3,
  className,
}: {
  label: string;
  lines?: number;
  className?: string;
}) {
  return (
    <div role="status" aria-label={label} aria-busy="true" className={cx("grid gap-2", className)}>
      <span className="sr-only">{label}…</span>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          aria-hidden="true"
          className={cx(
            "shimmer h-4 rounded-sm bg-border",
            i === 0 && "w-2/5",
            i > 0 && i !== lines - 1 && "w-full",
            i === lines - 1 && "w-3/5",
          )}
        />
      ))}
    </div>
  );
}
