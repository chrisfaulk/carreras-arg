"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { Moon02Icon, Sun03Icon } from "@hugeicons/core-free-icons";
import { clsx as cx } from "clsx";
import { setTheme, type Theme } from "./theme";

export default function ThemeToggle({ value, className }: { value: Theme | "system"; className?: string }) {
  const next: Theme = value === "dark" ? "light" : "dark";

  return (
    <form action={setTheme.bind(null, next)} className={cx("inline-flex", className)}>
      <button
        type="submit"
        aria-label={value === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
        title={value === "dark" ? "Modo claro" : "Modo oscuro"}
        className="rounded-md px-3 py-1.5 text-sm text-muted transition-colors hover:text-primary"
      >
        <HugeiconsIcon icon={value === "dark" ? Sun03Icon : Moon02Icon} size={16} />
      </button>
    </form>
  );
}
