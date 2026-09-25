"use client";

import { useSyncExternalStore } from "react";
import { clsx as cx } from "clsx";

const KEY = "cookies-dismissed";

const listeners = new Set<() => void>();

function read(): boolean {
  try {
    return localStorage.getItem(KEY) !== null;
  } catch {
    return true;
  }
}

function emit(): void {
  for (const listener of listeners) listener();
}

function subscribe(emitFn: () => void): () => void {
  listeners.add(emitFn);

  return () => {
    listeners.delete(emitFn);
  };
}

function snapshot(): boolean {
  return read();
}

function serverSnapshot(): boolean {
  return true;
}

function dismiss(): void {
  try {
    localStorage.setItem(KEY, "1");
  } catch {
    /* sin almacenamiento, se cierra igual */
  }

  emit();
}

export default function CookieBanner({ className }: { className?: string }) {
  const dismissed = useSyncExternalStore(subscribe, snapshot, serverSnapshot);

  if (dismissed) return null;

  return (
    <div
      role="region"
      aria-label="Aviso de cookies"
      className={cx("fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface backdrop-blur", className)}
    >
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-2 px-4 py-3 text-sm text-muted md:flex-row md:items-center md:justify-between md:px-8">
        <p>
          Solo usamos cookies necesarias para la sesión. Ver{" "}
          <a className="text-primary underline underline-offset-4" href="/legal/cookies">
            política de cookies
          </a>
          .
        </p>
        <button
          type="button"
          onClick={dismiss}
          className="w-fit shrink-0 rounded-full border border-border px-3 py-1.5 text-sm font-medium text-fg transition-colors hover:border-primary"
        >
          Cerrar aviso
        </button>
      </div>
    </div>
  );
}
