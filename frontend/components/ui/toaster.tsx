"use client";

import { useSyncExternalStore } from "react";
import { clsx as cx } from "clsx";

let current: string | null = null;

const listeners = new Set<() => void>();

function subscribe(emit: () => void): () => void {
  listeners.add(emit);

  return () => {
    listeners.delete(emit);
  };
}

function snapshot(): string | null {
  return current;
}

export function toast(message: string): void {
  current = message;

  for (const emit of listeners) emit();
}

export default function Toaster({ className }: { className?: string }) {
  const message = useSyncExternalStore(subscribe, snapshot, snapshot);

  if (!message) return null;

  return (
    <div className={cx("pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4", className)}>
      <p
        role="status"
        className="pointer-events-auto max-w-prose rounded-full bg-fg px-4 py-2 text-center text-sm font-medium text-bg shadow-md"
      >
        {message}
      </p>
    </div>
  );
}
