"use client";

import { useRouter } from "next/navigation";
import { clsx as cx } from "clsx";

export default function BackButton({ fallback = "/", className }: { fallback?: string; className?: string }) {
  const router = useRouter();

  function back(): void {
    if (window.history.length > 1) router.back();
    else router.push(fallback);
  }

  return (
    <button
      type="button"
      onClick={back}
      className={cx(
        "inline-flex items-center justify-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 text-sm font-medium text-fg transition-colors hover:border-primary",
        className,
      )}
    >
      Volver a la página anterior
    </button>
  );
}
