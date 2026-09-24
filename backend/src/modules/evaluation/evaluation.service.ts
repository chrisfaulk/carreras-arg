import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { PrismaService } from "../../prisma.service";
import { ERR, OkResult } from "../../shared/api-error";
import { lockedEnrollment } from "../../shared/read-models";

export const instanceSchema = z.object({
  type: z.enum(["PARTIAL", "PRACTICAL_WORK", "DELIVERABLE", "OTHER"]),
  customTypeName: z.string().min(1).max(120).optional(),
  grade: z.number().int().min(1).max(10).optional(),
  examDate: z.string().date().optional(),
  sortOrder: z.number().int().min(0).optional(),
});

export type InstanceInput = z.input<typeof instanceSchema>;

export type InstanceData = z.infer<typeof instanceSchema>;

export const instanceUpdateSchema = z.object({
  type: z.enum(["PARTIAL", "PRACTICAL_WORK", "DELIVERABLE", "OTHER"]).optional(),
  customTypeName: z.string().min(1).max(120).nullable().optional(),
  grade: z.number().int().min(1).max(10).nullable().optional(),
  examDate: z.string().date().nullable().optional(),
  sortOrder: z.number().int().min(0).optional(),
});

export type InstanceUpdateInput = z.input<typeof instanceUpdateSchema>;

export type InstanceUpdateData = z.infer<typeof instanceUpdateSchema>;

const instanceSelect = {
  id: true,
  subjectAttemptId: true,
  type: true,
  customTypeName: true,
  grade: true,
  examDate: true,
  sortOrder: true,
} satisfies Prisma.EvaluationInstanceSelect;

@Injectable()
export class EvaluationService {
  constructor(private readonly prisma: PrismaService) {}

  listInstances(userId: string, attemptId: string) {
    return this.prisma.withUserContext(userId, async (tx) => {
      const attempt = await this.ownedAttempt(tx, userId, attemptId);

      return tx.evaluationInstance.findMany({
        where: { subjectAttemptId: attempt.id },
        orderBy: { sortOrder: "asc" },
        select: instanceSelect,
      });
    });
  }

  createInstance(userId: string, attemptId: string, data: InstanceData) {
    return this.prisma.withUserContext(userId, (tx) => this.createInstanceTx(tx, userId, attemptId, data));
  }

  updateInstance(userId: string, instanceId: string, data: InstanceUpdateData) {
    return this.prisma.withUserContext(userId, (tx) => this.updateInstanceTx(tx, userId, instanceId, data));
  }

  deleteInstance(userId: string, instanceId: string): Promise<OkResult> {
    return this.prisma.withUserContext(userId, async (tx) => {
      const instance = await tx.evaluationInstance.findUnique({
        where: { id: instanceId },
        select: { id: true, attempt: { select: { id: true, enrollment: { select: { id: true, userId: true } } } } },
      });

      if (!instance || instance.attempt.enrollment.userId !== userId) ERR.notFound();

      await lockedEnrollment(tx, instance!.attempt.enrollment.id, userId);
      await tx.evaluationRetake.deleteMany({ where: { evaluationInstanceId: instanceId } });
      await tx.evaluationInstance.delete({ where: { id: instanceId } });

      return { ok: true };
    });
  }

  private async ownedAttempt(tx: Prisma.TransactionClient, userId: string, attemptId: string) {
    const attempt = await tx.subjectAttempt.findUnique({
      where: { id: attemptId },
      select: { id: true, enrollment: { select: { id: true, userId: true } } },
    });

    if (!attempt || attempt.enrollment.userId !== userId) ERR.notFound();

    return { id: attempt!.id, enrollmentId: attempt!.enrollment.id };
  }

  private checkCustomName(type: string, customTypeName: string | null | undefined): void {
    if (type === "OTHER" && !customTypeName) ERR.unprocessable("INVALID_TYPE_NAME", "OTHER requiere nombre");
  }

  private async createInstanceTx(tx: Prisma.TransactionClient, userId: string, attemptId: string, data: InstanceData) {
    const attempt = await this.ownedAttempt(tx, userId, attemptId);

    await lockedEnrollment(tx, attempt.enrollmentId, userId);
    this.checkCustomName(data.type, data.customTypeName);

    const sortOrder = data.sortOrder ?? (await tx.evaluationInstance.count({ where: { subjectAttemptId: attemptId } }));

    return tx.evaluationInstance.create({
      data: {
        subjectAttemptId: attemptId,
        type: data.type,
        customTypeName: data.customTypeName,
        grade: data.grade,
        examDate: data.examDate ? new Date(data.examDate) : undefined,
        sortOrder,
        createdBy: userId,
      },
      select: instanceSelect,
    });
  }

  private async updateInstanceTx(
    tx: Prisma.TransactionClient,
    userId: string,
    instanceId: string,
    data: InstanceUpdateData,
  ) {
    const instance = await tx.evaluationInstance.findUnique({
      where: { id: instanceId },
      select: {
        ...instanceSelect,
        attempt: { select: { id: true, enrollment: { select: { id: true, userId: true } } } },
      },
    });

    if (!instance || instance.attempt.enrollment.userId !== userId) ERR.notFound();

    await lockedEnrollment(tx, instance!.attempt.enrollment.id, userId);

    const type = data.type ?? instance!.type;

    const customTypeName = data.customTypeName !== undefined ? data.customTypeName : instance!.customTypeName;

    this.checkCustomName(type, customTypeName);

    const patch: Prisma.EvaluationInstanceUpdateInput = { updatedBy: userId };

    if (data.type !== undefined) patch.type = data.type;

    if (data.customTypeName !== undefined) patch.customTypeName = data.customTypeName;

    if (data.grade !== undefined) patch.grade = data.grade;

    if (data.examDate !== undefined) patch.examDate = data.examDate ? new Date(data.examDate) : null;

    if (data.sortOrder !== undefined) patch.sortOrder = data.sortOrder;

    return tx.evaluationInstance.update({ where: { id: instanceId }, data: patch, select: instanceSelect });
  }
}
