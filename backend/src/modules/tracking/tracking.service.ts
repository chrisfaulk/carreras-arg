import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { PrismaService } from "../../prisma.service";
import { ERR } from "../../shared/api-error";
import { lockedEnrollment } from "../../shared/read-models";
import { checkTransition } from "./attempt-machine";
import { closeAttempt } from "./attempt-closer";
import { insufficientCorrelatives, visibleStatus, CorrelativeRow, VisibleStatus } from "./availability-reader";
import { effectiveGrade } from "../evaluation/effective-grade";
import { ListQuery, paged } from "../../shared/pagination";

export type { VisibleStatus } from "./availability-reader";

export const createAttemptSchema = z.object({ subjectId: z.string().uuid() });

export type CreateAttemptInput = z.input<typeof createAttemptSchema>;

export type CreateAttemptData = z.infer<typeof createAttemptSchema>;

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

  closeAttempt(userId: string, attemptId: string) {
    return this.prisma.withUserContext(userId, (tx) => this.closeAttemptTx(tx, userId, attemptId));
  }

  planSubjects(userId: string, planId: string, query: ListQuery) {
    return this.prisma.withUserContext(userId, (tx) => this.planSubjectsTx(tx, userId, planId, query));
  }

  cursables(userId: string, enrollmentId: string, query: ListQuery) {
    return this.prisma.withUserContext(userId, (tx) => this.cursablesTx(tx, userId, enrollmentId, query));
  }

  private async planSubjectsTx(tx: Prisma.TransactionClient, userId: string, planId: string, query: ListQuery) {
    const plan = await tx.studyPlan.findUnique({ where: { id: planId }, select: { id: true } });

    if (!plan) ERR.notFound();

    const enrollment = await tx.userStudyPlanEnrollment.findUnique({
      where: { userId_studyPlanId: { userId, studyPlanId: planId } },
      select: { id: true },
    });

    if (!enrollment) ERR.notFound();

    // ponytail: subjects per plan fit in memory; move q/status to DB when plans grow past hundreds
    const [subjects, attempts] = await Promise.all([
      tx.subject.findMany({
        where: { studyPlanId: planId },
        orderBy: { name: "asc" },
        select: { id: true, studyPlanId: true, name: true, isElective: true, requiresFinal: true },
      }),
      tx.subjectAttempt.findMany({
        where: { studyPlanEnrollmentId: enrollment!.id, annulledAt: null },
        select: { subjectId: true, status: true },
      }),
    ]);

    const correlatives = await tx.subjectCorrelative.findMany({
      where: { subjectId: { in: subjects.map((subject) => subject.id) } },
      select: { subjectId: true, correlativeSubjectId: true, type: true },
    });

    const bySubject = new Map<string, CorrelativeRow[]>();

    for (const correlative of correlatives) {
      const current = bySubject.get(correlative.subjectId);

      if (current) current.push(correlative);
      else bySubject.set(correlative.subjectId, [correlative]);
    }

    const prefix = query.q?.toLowerCase();
    const rows = [];

    for (const subject of subjects) {
      if (prefix && !subject.name.toLowerCase().startsWith(prefix)) continue;

      const status = visibleStatus(attempts, bySubject.get(subject.id) ?? [], subject.id);

      if (query.status && status !== query.status) continue;

      rows.push({
        ...subject,
        status,
        insufficientCorrelatives: insufficientCorrelatives(attempts, bySubject.get(subject.id) ?? [], subject.id),
      });
    }

    return paged(
      rows.slice((query.page - 1) * query.limit, query.page * query.limit),
      rows.length,
      query.page,
      query.limit,
    );
  }

  private async cursablesTx(tx: Prisma.TransactionClient, userId: string, enrollmentId: string, query: ListQuery) {
    const enrollment = await tx.userStudyPlanEnrollment.findUnique({
      where: { id: enrollmentId },
      select: { id: true, userId: true, studyPlanId: true },
    });

    if (!enrollment || enrollment.userId !== userId) ERR.notFound();

    const page = await this.planSubjectsTx(tx, userId, enrollment!.studyPlanId, {
      ...query,
      status: "AVAILABLE",
    });

    return page;
  }

  private async closeAttemptTx(tx: Prisma.TransactionClient, userId: string, attemptId: string) {
    const attempt = await tx.subjectAttempt.findUnique({
      where: { id: attemptId },
      select: {
        ...attemptSelect,
        annulledAt: true,
        enrollment: { select: { id: true, userId: true } },
        subject: { select: { id: true, requiresFinal: true } },
      },
    });

    if (!attempt || attempt.annulledAt || attempt.enrollment.userId !== userId) ERR.notFound();

    await lockedEnrollment(tx, attempt!.enrollment.id, userId);

    if (attempt!.status !== "IN_PROGRESS") ERR.unprocessable("INVALID_TRANSITION", "Solo se cierra cursada");

    const instances = await tx.evaluationInstance.findMany({
      where: { subjectAttemptId: attemptId },
      select: { grade: true, retakes: { select: { grade: true } } },
    });

    const effectiveGrades = instances.map((instance) =>
      effectiveGrade(
        instance.grade,
        instance.retakes.map((retake) => retake.grade),
      ),
    );

    const closed = closeAttempt({
      effectiveGrades,
      minRegularize: attempt!.minRegularize,
      minPromote: attempt!.minPromote,
      requiresFinal: attempt!.subject.requiresFinal,
    });

    if ("error" in closed) {
      ERR.unprocessable("INCOMPLETE_INSTANCES", "Quedan instancias sin nota");
    } else {
      const row = await tx.subjectAttempt.update({
        where: { id: attemptId },
        data: { status: closed.status, finalGrade: closed.finalGrade, updatedBy: userId },
        select: attemptSelect,
      });

      if (closed.status === "PASSED") {
        await tx.subjectAttempt.updateMany({
          where: {
            studyPlanEnrollmentId: attempt!.enrollment.id,
            subjectId: attempt!.subject.id,
            status: "PENDING_FINAL",
            annulledAt: null,
            id: { not: attemptId },
          },
          data: { annulledAt: new Date() },
        });
      }

      return row;
    }
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

    const visible = await this.resolveVisible(tx, enrollment.id, data.subjectId);

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

  private async resolveVisible(
    tx: Prisma.TransactionClient,
    enrollmentId: string,
    subjectId: string,
  ): Promise<VisibleStatus> {
    const attempts = await tx.subjectAttempt.findMany({
      where: { studyPlanEnrollmentId: enrollmentId, annulledAt: null },
      select: { subjectId: true, status: true },
    });

    const correlatives = await tx.subjectCorrelative.findMany({
      where: { subjectId },
      select: { correlativeSubjectId: true, type: true },
    });

    return visibleStatus(attempts, correlatives, subjectId);
  }
}
