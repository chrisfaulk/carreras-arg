"use client";

import { useSyncExternalStore } from "react";
import type { Theme } from "./theme";

export type ThemeValue = Theme | "system";

const KEY = "theme";

const MAX_AGE = 31536000;

const listeners = new Set<() => void>();

function read(): ThemeValue {
  try {
    const stored = localStorage.getItem(KEY);

    if (stored === "light" || stored === "dark") return stored;
  } catch {
    /* sin almacenamiento, se usa el default */
  }

  return "system";
}

function emit(): void {
  for (const listener of listeners) listener();
}

function onStorage(event: StorageEvent): void {
  if (event.key === KEY) emit();
}

function subscribe(emitFn: () => void): () => void {
  listeners.add(emitFn);
  window.addEventListener("storage", onStorage);

  return () => {
    listeners.delete(emitFn);
    window.removeEventListener("storage", onStorage);
  };
}

function snapshot(): ThemeValue {
  return read();
}

function serverSnapshot(): ThemeValue {
  return "system";
}

export function setThemeValue(next: Theme): void {
  try {
    localStorage.setItem(KEY, next);
  } catch {
    /* sin almacenamiento, igual se aplica en memoria */
  }

  const secure = window.location.protocol === "https:" ? "; secure" : "";

  document.cookie = `${KEY}=${next}; path=/; max-age=${MAX_AGE}; samesite=lax${secure}`;

  emit();
}

export function useThemeValue(): ThemeValue {
  return useSyncExternalStore(subscribe, snapshot, serverSnapshot);
}
