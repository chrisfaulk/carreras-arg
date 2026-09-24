import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { PrismaService } from "../../prisma.service";
import { ERR } from "../../shared/api-error";

export const enrollSchema = z.object({ studyPlanId: z.string().uuid() });

export type EnrollInput = z.input<typeof enrollSchema>;

export type EnrollData = z.infer<typeof enrollSchema>;

function isDuplicate(error: unknown): error is Prisma.PrismaClientKnownRequestError {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

const enrollmentSelect = {
  id: true,
  studyPlanId: true,
  studyPlan: { select: { id: true, careerId: true, year: true, requiredElectives: true } },
} satisfies Prisma.UserStudyPlanEnrollmentSelect;

@Injectable()
export class EnrollmentService {
  constructor(private readonly prisma: PrismaService) {}

  async enroll(userId: string, data: EnrollData) {
    const plan = await this.prisma.studyPlan.findUnique({ where: { id: data.studyPlanId }, select: { id: true } });

    if (!plan) ERR.notFound();

    try {
      return await this.prisma.userStudyPlanEnrollment.create({
        data: { userId, studyPlanId: data.studyPlanId, createdBy: userId },
        select: { id: true, studyPlanId: true },
      });
    } catch (error) {
      if (isDuplicate(error)) ERR.conflict("DUPLICATE", "Ya anotado a ese plan");

      throw error;
    }
  }

  listMine(userId: string) {
    return this.prisma.userStudyPlanEnrollment.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
      select: enrollmentSelect,
    });
  }
}
