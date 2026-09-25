import Link from "next/link";
import { clsx as cx } from "clsx";

type Variant = "primary" | "secondary" | "ghost" | "danger";

type Size = "sm" | "md";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-fg text-bg border border-transparent hover:opacity-90",
  secondary: "bg-surface text-fg border border-border hover:border-fg shadow-sm",
  ghost: "text-fg underline underline-offset-4 decoration-border hover:decoration-fg",
  danger: "bg-danger text-on-danger border border-transparent hover:opacity-90",
};

const SIZES: Record<Size, string> = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-md",
};

export default function Button({
  variant = "primary",
  size = "md",
  href,
  className,
  children,
  ...rest
}: {
  variant?: Variant;
  size?: Size;
  href?: string;
  className?: string;
  children: React.ReactNode;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const styles = cx(
    "inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors",
    "disabled:cursor-not-allowed disabled:opacity-50",
    VARIANTS[variant],
    SIZES[size],
    className,
  );

  if (href) {
    return (
      <Link href={href} className={styles}>
        {children}
      </Link>
    );
  }

  return (
    <button type="button" className={styles} {...rest}>
      {children}
    </button>
  );
}
