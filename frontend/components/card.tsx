import { clsx as cx } from "clsx";

export default function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cx("p-6 shadow-sm md:p-8", className)}>{children}</div>;
}
