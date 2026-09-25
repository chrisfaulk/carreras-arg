import Link from "next/link";
import { clsx as cx } from "clsx";

export interface TabItem {
  href: string;
  label: string;
  current: boolean;
}

export default function Tabs({ items, label, className }: { items: TabItem[]; label: string; className?: string }) {
  return (
    <nav aria-label={label} className={cx("-mx-1 overflow-x-auto px-1", className)}>
      <ul className="flex gap-1 border-b border-border">
        {items.map((item) => (
          <li key={item.href} className="shrink-0">
            <Link
              href={item.href}
              aria-current={item.current ? "page" : undefined}
              className={cx(
                "-mb-px border-b-2 px-3 py-2 text-sm transition-colors",
                item.current
                  ? "border-primary font-medium text-fg"
                  : "border-transparent text-muted hover:text-primary",
              )}
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
