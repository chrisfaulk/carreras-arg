"use client";

import { useState } from "react";

const drafts = new Map<string, string>();

function key(form: string, field: string): string {
  return `${form}.${field}`;
}

export function clearDraft(form: string): void {
  const prefix = `${form}.`;

  for (const k of drafts.keys()) {
    if (k.startsWith(prefix)) drafts.delete(k);
  }
}

export function clearAllDrafts(): void {
  drafts.clear();
}

export function useDraftState(form: string, field: string, initial = ""): [string, (next: string) => void] {
  const [value, setValue] = useState(() => drafts.get(key(form, field)) ?? initial);

  function set(next: string): void {
    drafts.set(key(form, field), next);
    setValue(next);
  }

  return [value, set];
}
