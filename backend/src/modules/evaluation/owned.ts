import { Prisma } from "@prisma/client";
import { ERR } from "../../shared/api-error";
import { lockedEnrollment } from "../../shared/read-models";
import { checkFinalAllowed } from "./final-guard";

export interface OwnedAttempt {
  id: string;
  enrollmentId: string;
  subject: { id: string; requiresFinal: boolean };
}

export async function ownedAttempt(
  tx: Prisma.TransactionClient,
  userId: string,
  attemptId: string,
): Promise<OwnedAttempt> {
  const attempt = await tx.subjectAttempt.findUnique({
    where: { id: attemptId },
    select: {
      id: true,
      enrollment: { select: { id: true, userId: true } },
      subject: { select: { id: true, requiresFinal: true } },
    },
  });

  if (!attempt || attempt.enrollment.userId !== userId) ERR.notFound();

  return { id: attempt!.id, enrollmentId: attempt!.enrollment.id, subject: attempt!.subject };
}

export async function lockedAttempt(
  tx: Prisma.TransactionClient,
  userId: string,
  attemptId: string,
): Promise<OwnedAttempt> {
  const attempt = await ownedAttempt(tx, userId, attemptId);

  await lockedEnrollment(tx, attempt.enrollmentId, userId);

  return attempt;
}

export interface OwnedInstance {
  id: string;
  attemptId: string;
  enrollmentId: string;
}

export async function lockedInstance(
  tx: Prisma.TransactionClient,
  userId: string,
  instanceId: string,
): Promise<OwnedInstance> {
  const instance = await tx.evaluationInstance.findUnique({
    where: { id: instanceId },
    select: {
      id: true,
      attempt: { select: { id: true, enrollment: { select: { id: true, userId: true } } } },
    },
  });

  if (!instance || instance.attempt.enrollment.userId !== userId) ERR.notFound();

  await lockedEnrollment(tx, instance!.attempt.enrollment.id, userId);

  return { id: instance!.id, attemptId: instance!.attempt.id, enrollmentId: instance!.attempt.enrollment.id };
}

export interface OwnedRetake {
  id: string;
  enrollmentId: string;
}

export async function lockedRetake(
  tx: Prisma.TransactionClient,
  userId: string,
  retakeId: string,
): Promise<OwnedRetake> {
  const retake = await tx.evaluationRetake.findUnique({
    where: { id: retakeId },
    select: {
      id: true,
      instance: { select: { attempt: { select: { enrollment: { select: { id: true, userId: true } } } } } },
    },
  });

  if (!retake || retake.instance.attempt.enrollment.userId !== userId) ERR.notFound();

  await lockedEnrollment(tx, retake!.instance.attempt.enrollment.id, userId);

  return { id: retake!.id, enrollmentId: retake!.instance.attempt.enrollment.id };
}

export interface OwnedFinal {
  id: string;
  attemptId: string;
  enrollmentId: string;
  grade: number | null;
  requiresFinal: boolean;
  subjectId: string;
}

export async function lockedFinal(tx: Prisma.TransactionClient, userId: string, finalId: string): Promise<OwnedFinal> {
  const final = await tx.finalExam.findUnique({
    where: { id: finalId },
    select: {
      id: true,
      grade: true,
      attempt: {
        select: {
          id: true,
          enrollment: { select: { id: true, userId: true } },
          subject: { select: { id: true, requiresFinal: true } },
        },
      },
    },
  });

  if (!final || final.attempt.enrollment.userId !== userId) ERR.notFound();

  await lockedEnrollment(tx, final!.attempt.enrollment.id, userId);

  return {
    id: final!.id,
    attemptId: final!.attempt.id,
    enrollmentId: final!.attempt.enrollment.id,
    grade: final!.grade,
    requiresFinal: final!.attempt.subject.requiresFinal,
    subjectId: final!.attempt.subject.id,
  };
}

export async function assertFinalSlot(
  tx: Prisma.TransactionClient,
  enrollmentId: string,
  subjectId: string,
  selfAttemptId: string,
  input: { requiresFinal: boolean; grade?: number | null },
): Promise<void> {
  const siblings = await tx.subjectAttempt.count({
    where: {
      studyPlanEnrollmentId: enrollmentId,
      subjectId,
      status: "IN_PROGRESS",
      annulledAt: null,
      id: { not: selfAttemptId },
    },
  });

  const blocked = checkFinalAllowed({ ...input, siblingInProgress: siblings > 0 });

  if (blocked === "FINAL_BLOCKED_BY_IN_PROGRESS") ERR.conflict(blocked, "Hay cursada en progreso para esa materia");

  if (blocked) ERR.conflict(blocked, "Materia sin final obligatorio");
}
