"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { Moon02Icon, Sun03Icon } from "@hugeicons/core-free-icons";
import { clsx as cx } from "clsx";
import { setThemeValue, useThemeValue, type ThemeValue } from "./theme-store";
import type { Theme } from "./theme";

export default function ThemeToggle({ initial, className }: { initial: ThemeValue; className?: string }) {
  const stored = useThemeValue();
  const value = stored === "system" ? initial : stored;
  const next: Theme = value === "dark" ? "light" : "dark";

  return (
    <button
      type="button"
      onClick={() => setThemeValue(next)}
      aria-label={value === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      title={value === "dark" ? "Modo claro" : "Modo oscuro"}
      className={cx("rounded-full px-3 py-1.5 text-sm text-muted transition-colors hover:text-primary", className)}
    >
      <HugeiconsIcon icon={value === "dark" ? Sun03Icon : Moon02Icon} size={16} />
    </button>
  );
}
