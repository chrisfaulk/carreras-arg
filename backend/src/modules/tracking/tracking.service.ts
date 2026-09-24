import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { PrismaService } from "../../prisma.service";
import { ERR } from "../../shared/api-error";
import { lockedEnrollment } from "../../shared/read-models";

export const createAttemptSchema = z.object({ subjectId: z.string().uuid() });

export type CreateAttemptInput = z.input<typeof createAttemptSchema>;

export type CreateAttemptData = z.infer<typeof createAttemptSchema>;

export type VisibleStatus = "NOT_AVAILABLE" | "AVAILABLE" | "PENDING_FINAL" | "IN_PROGRESS" | "PASSED";

const PREVIOUS_OK = new Set(["PASSED", "PENDING_FINAL"]);

const CONCURRENT_OK = new Set(["PASSED", "PENDING_FINAL", "IN_PROGRESS"]);

const attemptSelect = {
  id: true,
  studyPlanEnrollmentId: true,
  subjectId: true,
  status: true,
  minRegularize: true,
  minPromote: true,
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
