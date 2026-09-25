import { clsx as cx } from "clsx";

export default function TextField({
  id,
  label,
  error,
  className,
  ...rest
}: {
  id: string;
  label: string;
  error?: string;
  className?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  const errorId = `${id}-error`;

  return (
    <div className={cx("grid gap-1.5", className)}>
      <label className="text-sm font-medium" htmlFor={id}>
        {label}
      </label>

      <input
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        className={cx(
          "w-full rounded-full border px-3 py-2 text-md placeholder:text-muted",
          error ? "border-danger" : "border-border focus:border-primary",
        )}
        {...rest}
      />

      {error ? (
        <p id={errorId} className="text-sm text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
