import type { VisibleStatus } from "@/features/catalog/catalog";

export const STATUS_LABEL: Record<VisibleStatus, string> = {
  PASSED: "Aprobada",
  IN_PROGRESS: "Cursando",
  PENDING_FINAL: "En final",
  AVAILABLE: "Cursable",
  NOT_AVAILABLE: "No disponible",
};

export const STATUS_TONE = {
  PASSED: "passed",
  IN_PROGRESS: "progress",
  PENDING_FINAL: "pending",
  AVAILABLE: "available",
  NOT_AVAILABLE: "idle",
} as const;
