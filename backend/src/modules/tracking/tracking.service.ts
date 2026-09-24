import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { PrismaService } from "../../prisma.service";
import { ERR } from "../../shared/api-error";
import { lockedEnrollment } from "../../shared/read-models";
import { checkTransition } from "./attempt-machine";

export const createAttemptSchema = z.object({ subjectId: z.string().uuid() });

export type CreateAttemptInput = z.input<typeof createAttemptSchema>;

export type CreateAttemptData = z.infer<typeof createAttemptSchema>;

export type VisibleStatus = "NOT_AVAILABLE" | "AVAILABLE" | "PENDING_FINAL" | "IN_PROGRESS" | "PASSED";

export const updateAttemptSchema = z.object({
  status: z.enum(["IN_PROGRESS", "PENDING_FINAL", "PASSED", "FAILED", "AVAILABLE", "NOT_AVAILABLE"]),
  finalGrade: z.number().int().min(1).max(10).optional(),
  termYear: z.number().int().min(1900).max(2100).optional(),
  term: z.enum(["FIRST", "SECOND"]).optional(),
  minRegularize: z.number().int().min(1).max(10).optional(),
  minPromote: z.number().int().min(1).max(10).optional(),
});

export type UpdateAttemptInput = z.input<typeof updateAttemptSchema>;

export type UpdateAttemptData = z.infer<typeof updateAttemptSchema>;

const PREVIOUS_OK = new Set(["PASSED", "PENDING_FINAL"]);

const CONCURRENT_OK = new Set(["PASSED", "PENDING_FINAL", "IN_PROGRESS"]);

const attemptSelect = {
  id: true,
  studyPlanEnrollmentId: true,
  subjectId: true,
  status: true,
  finalGrade: true,
  minRegularize: true,
  minPromote: true,
  termYear: true,
  term: true,
} satisfies Prisma.SubjectAttemptSelect;

@Injectable()
export class TrackingService {
  constructor(private readonly prisma: PrismaService) {}

  createAttempt(userId: string, enrollmentId: string, data: CreateAttemptData) {
    return this.prisma.withUserContext(userId, (tx) =>
      this.createAttemptTx(
        tx,
        lockedEnrollment(tx, enrollmentId, userId).then((e) => e),
        userId,
        data,
      ),
    );
  }

  updateAttempt(userId: string, attemptId: string, data: UpdateAttemptData) {
    return this.prisma.withUserContext(userId, (tx) => this.updateAttemptTx(tx, userId, attemptId, data));
  }

  private async updateAttemptTx(
    tx: Prisma.TransactionClient,
    userId: string,
    attemptId: string,
    data: UpdateAttemptData,
  ) {
    const attempt = await tx.subjectAttempt.findUnique({
      where: { id: attemptId },
      select: {
        ...attemptSelect,
        enrollment: { select: { id: true, userId: true } },
        subject: { select: { requiresFinal: true } },
      },
    });

    if (!attempt || attempt.enrollment.userId !== userId) ERR.notFound();

    await lockedEnrollment(tx, attempt!.enrollment.id, userId);

    if (attempt!.status !== "IN_PROGRESS" && (data.minRegularize !== undefined || data.minPromote !== undefined))
      ERR.unprocessable("INVALID_TRANSITION", "Umbrales solo editables en cursada");

    const finals = await tx.finalExam.findMany({ where: { subjectAttemptId: attemptId }, select: { grade: true } });

    const error = checkTransition({
      from: attempt!.status,
      to: data.status,
      requiresFinal: attempt!.subject.requiresFinal,
      minPromote: data.minPromote ?? attempt!.minPromote,
      hasApprovedFinal: finals.some((final) => (final.grade ?? 0) >= 4),
      finalGrade: data.finalGrade,
    });

    if (error === "FINAL_EXAM_REQUIRED") ERR.unprocessable(error, "Requiere final aprobado");

    if (error === "GRADE_REQUIRED") ERR.unprocessable(error, "Requiere nota final");

    if (error === "GRADE_BELOW_PROMOTE") ERR.unprocessable(error, "Nota menor a promoción");

    if (error) ERR.unprocessable(error, "Transición inválida");

    const status =
      data.status === "IN_PROGRESS" || data.status === "PENDING_FINAL" || data.status === "PASSED"
        ? data.status
        : undefined;

    if (!status) ERR.unprocessable("INVALID_TRANSITION", "Transición inválida");

    const patch: Prisma.SubjectAttemptUpdateInput = { status, updatedBy: userId };

    if (data.finalGrade !== undefined) patch.finalGrade = data.finalGrade;

    if (data.termYear !== undefined) patch.termYear = data.termYear;

    if (data.term !== undefined) patch.term = data.term;

    if (data.minRegularize !== undefined) patch.minRegularize = data.minRegularize;

    if (data.minPromote !== undefined) patch.minPromote = data.minPromote;

    return tx.subjectAttempt.update({ where: { id: attemptId }, data: patch, select: attemptSelect });
  }

  private async createAttemptTx(
    tx: Prisma.TransactionClient,
    enrollmentPromise: Promise<{ id: string; userId: string; studyPlanId: string }>,
    userId: string,
    data: CreateAttemptData,
  ) {
    const enrollment = await enrollmentPromise;

    const subject = await tx.subject.findUnique({
      where: { id: data.subjectId },
      select: { id: true, studyPlanId: true },
    });

    if (!subject || subject.studyPlanId !== enrollment.studyPlanId)
      ERR.unprocessable("INVALID_SUBJECT", "La materia no pertenece al plan");

    const visible = await this.visibleStatus(tx, enrollment.id, data.subjectId);

    if (visible !== "AVAILABLE" && visible !== "PENDING_FINAL")
      ERR.conflict("INVALID_VISIBLE_STATE", "La materia no está disponible para cursar");

    return tx.subjectAttempt.create({
      data: {
        studyPlanEnrollmentId: enrollment.id,
        subjectId: data.subjectId,
        status: "IN_PROGRESS",
        createdBy: userId,
        instances: {
          create: [
            { type: "PARTIAL", sortOrder: 0 },
            { type: "PARTIAL", sortOrder: 1 },
          ],
        },
      },
      select: attemptSelect,
    });
  }

  private async visibleStatus(
    tx: Prisma.TransactionClient,
    enrollmentId: string,
    subjectId: string,
  ): Promise<VisibleStatus> {
    const attempts = await tx.subjectAttempt.findMany({
      where: { studyPlanEnrollmentId: enrollmentId, annulledAt: null },
      select: { subjectId: true, status: true },
    });

    const aggregate = new Map<string, Set<string>>();

    for (const attempt of attempts) {
      if (attempt.status === "FAILED") continue;

      const current = aggregate.get(attempt.subjectId);

      if (current) current.add(attempt.status);
      else aggregate.set(attempt.subjectId, new Set([attempt.status]));
    }

    const own = aggregate.get(subjectId);

    if (own?.has("PASSED")) return "PASSED";

    if (own?.has("IN_PROGRESS")) return "IN_PROGRESS";

    if (own?.has("PENDING_FINAL")) return "PENDING_FINAL";

    const correlatives = await tx.subjectCorrelative.findMany({
      where: { subjectId },
      select: { correlativeSubjectId: true, type: true },
    });

    const available = correlatives.every((correlative) => {
      const statuses = aggregate.get(correlative.correlativeSubjectId);

      if (!statuses) return false;

      const ok = correlative.type === "PREVIOUS" ? PREVIOUS_OK : CONCURRENT_OK;

      for (const status of statuses) if (ok.has(status)) return true;

      return false;
    });

    return available ? "AVAILABLE" : "NOT_AVAILABLE";
  }
}
