import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma.service";
import { ERR, OkResult } from "../../shared/api-error";
import { lockedEnrollment } from "../../shared/read-models";
import {
  FinalExamData,
  FinalExamUpdateData,
  InstanceData,
  InstanceUpdateData,
  RetakeData,
  finalExamSelect,
  instanceSelect,
  retakeSelect,
} from "./dto";
import { assertFinalSlot, lockedFinal, lockedInstance, lockedRetake, ownedAttempt } from "./owned";

export * from "./dto";

@Injectable()
export class EvaluationService {
  constructor(private readonly prisma: PrismaService) {}

  listInstances(userId: string, attemptId: string) {
    return this.prisma.withUserContext(userId, async (tx) => {
      const attempt = await ownedAttempt(tx, userId, attemptId);

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
      const instance = await lockedInstance(tx, userId, instanceId);

      await tx.evaluationRetake.deleteMany({ where: { evaluationInstanceId: instance.id } });
      await tx.evaluationInstance.delete({ where: { id: instance.id } });

      return { ok: true };
    });
  }

  createRetake(userId: string, instanceId: string, data: RetakeData) {
    return this.prisma.withUserContext(userId, async (tx) => {
      const instance = await lockedInstance(tx, userId, instanceId);

      return tx.evaluationRetake.create({
        data: {
          evaluationInstanceId: instance.id,
          grade: data.grade,
          examDate: data.examDate ? new Date(data.examDate) : undefined,
        },
        select: retakeSelect,
      });
    });
  }

  deleteRetake(userId: string, retakeId: string): Promise<OkResult> {
    return this.prisma.withUserContext(userId, async (tx) => {
      const retake = await lockedRetake(tx, userId, retakeId);

      await tx.evaluationRetake.delete({ where: { id: retake.id } });

      return { ok: true };
    });
  }

  createFinalExam(userId: string, attemptId: string, data: FinalExamData) {
    return this.prisma.withUserContext(userId, async (tx) => {
      const attempt = await ownedAttempt(tx, userId, attemptId);

      await lockedEnrollment(tx, attempt.enrollmentId, userId);
      await assertFinalSlot(tx, attempt.enrollmentId, attempt.subject.id, attemptId, {
        requiresFinal: attempt.subject.requiresFinal,
        grade: data.grade,
      });

      return tx.finalExam.create({
        data: {
          subjectAttemptId: attemptId,
          grade: data.grade,
          examDate: data.examDate ? new Date(data.examDate) : undefined,
          isExternalExam: data.isExternalExam,
          createdBy: userId,
        },
        select: finalExamSelect,
      });
    });
  }

  updateFinalExam(userId: string, finalId: string, data: FinalExamUpdateData) {
    return this.prisma.withUserContext(userId, async (tx) => {
      const final = await lockedFinal(tx, userId, finalId);

      await assertFinalSlot(tx, final.enrollmentId, final.subjectId, final.attemptId, {
        requiresFinal: final.requiresFinal,
        grade: data.grade !== undefined ? data.grade : final.grade,
      });

      const patch: Prisma.FinalExamUpdateInput = { updatedBy: userId };

      if (data.grade !== undefined) patch.grade = data.grade;

      if (data.examDate !== undefined) patch.examDate = data.examDate ? new Date(data.examDate) : null;

      if (data.isExternalExam !== undefined) patch.isExternalExam = data.isExternalExam;

      return tx.finalExam.update({ where: { id: finalId }, data: patch, select: finalExamSelect });
    });
  }

  private checkCustomName(type: string, customTypeName: string | null | undefined): void {
    if (type === "OTHER" && !customTypeName) ERR.unprocessable("INVALID_TYPE_NAME", "OTHER requiere nombre");
  }

  private async createInstanceTx(tx: Prisma.TransactionClient, userId: string, attemptId: string, data: InstanceData) {
    const attempt = await ownedAttempt(tx, userId, attemptId);

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
