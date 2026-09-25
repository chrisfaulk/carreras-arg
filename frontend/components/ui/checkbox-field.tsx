import { clsx as cx } from "clsx";

export default function CheckboxField({
  id,
  label,
  hint,
  error,
  className,
  ...rest
}: {
  id: string;
  label: string;
  hint?: React.ReactNode;
  error?: string;
  className?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  const errorId = `${id}-error`;

  return (
    <div className={cx("grid gap-1.5", className)}>
      <label className="flex cursor-pointer items-start gap-2 text-sm leading-6" htmlFor={id}>
        <input
          id={id}
          type="checkbox"
          aria-describedby={error ? errorId : undefined}
          className="mt-1 size-4 shrink-0 cursor-pointer accent-[var(--color-fg)]"
          {...rest}
        />
        <span>{label}</span>
      </label>

      {hint ? <div className="pl-6 text-sm text-muted">{hint}</div> : null}
      {error ? (
        <p id={errorId} className="pl-6 text-sm text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
