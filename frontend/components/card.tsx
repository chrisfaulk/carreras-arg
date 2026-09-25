import { clsx as cx } from "clsx";

export default function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cx("rounded-lg border border-border bg-surface p-6 shadow-sm md:p-8", className)}>{children}</div>
  );
}
