import { clsx as cx } from "clsx";

type Tone = "solid" | "outline" | "passed" | "progress" | "pending" | "available" | "idle" | "danger";

const TONES: Record<Tone, string> = {
  solid: "bg-fg text-bg border-transparent",
  outline: "text-muted border-border",
  passed: "bg-passed text-on-passed border-transparent",
  progress: "bg-progress text-on-progress border-transparent",
  pending: "bg-pending text-on-pending border-transparent",
  available: "bg-available text-on-available border-transparent",
  idle: "text-muted border-border",
  danger: "bg-danger text-on-danger border-transparent",
};

export default function Badge({
  tone,
  className,
  children,
}: {
  tone: Tone;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cx(
        "inline-flex w-fit items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium tracking-tight",
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
