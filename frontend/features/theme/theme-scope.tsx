"use client";

import { clsx as cx } from "clsx";
import { useThemeValue, type ThemeValue } from "./theme-store";

export default function ThemeScope({
  initial,
  className,
  children,
}: {
  initial: ThemeValue;
  className?: string;
  children: React.ReactNode;
}) {
  const stored = useThemeValue();
  const resolved = stored === "system" ? initial : stored;

  return (
    <div
      data-theme={resolved === "system" ? undefined : resolved}
      suppressHydrationWarning
      className={cx("flex min-h-screen flex-col bg-bg text-fg", className)}
    >
      {children}
    </div>
  );
}
