import Badge from "@/components/ui/badge";
import type { PlanSubject, Subject } from "@/features/catalog/catalog";
import { STATUS_LABEL, STATUS_TONE } from "@/features/tracking/status";

export function isTracked(s: Subject | PlanSubject): s is PlanSubject {
  return "status" in s;
}

export function SubjectBadge({ subject, enrolled }: { subject: Subject | PlanSubject; enrolled: boolean }) {
  if (!enrolled || !isTracked(subject)) return null;

  return <Badge tone={STATUS_TONE[subject.status]}>{STATUS_LABEL[subject.status]}</Badge>;
}

export function InsufficientBlock({ subject, enrolled }: { subject: Subject | PlanSubject; enrolled: boolean }) {
  if (!enrolled || !isTracked(subject) || !subject.insufficientCorrelatives) return null;

  return <span className="block text-sm text-muted">Correlativas insuficientes</span>;
}

export function InsufficientSuffix({ subject, enrolled }: { subject: Subject | PlanSubject; enrolled: boolean }) {
  if (!enrolled || !isTracked(subject) || !subject.insufficientCorrelatives) return "";

  return " · Correlativas insuficientes";
}

export function ElectiveLabel({ subject }: { subject: Subject | PlanSubject }) {
  return subject.isElective ? "Electiva" : "Obligatoria";
}
