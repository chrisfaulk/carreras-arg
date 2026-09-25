import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma.service";
import { ERR, OkResult } from "../../shared/api-error";

@Injectable()
export class PrivacyService {
  constructor(private readonly prisma: PrismaService) {}

  async softDelete(userId: string): Promise<OkResult> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, deletedAt: true },
    });

    if (!user) ERR.notFound();

    if (user!.deletedAt) return { ok: true };

    const now = new Date();

    await this.prisma.$transaction([
      this.prisma.user.update({ where: { id: userId }, data: { deletedAt: now } }),
      this.prisma.refreshToken.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: now },
      }),
      this.prisma.university.updateMany({ where: { createdBy: userId }, data: { createdBy: null } }),
      this.prisma.university.updateMany({ where: { updatedBy: userId }, data: { updatedBy: null } }),
      this.prisma.career.updateMany({ where: { createdBy: userId }, data: { createdBy: null } }),
      this.prisma.career.updateMany({ where: { updatedBy: userId }, data: { updatedBy: null } }),
      this.prisma.studyPlan.updateMany({ where: { createdBy: userId }, data: { createdBy: null } }),
      this.prisma.studyPlan.updateMany({ where: { updatedBy: userId }, data: { updatedBy: null } }),
      this.prisma.subject.updateMany({ where: { createdBy: userId }, data: { createdBy: null } }),
      this.prisma.subject.updateMany({ where: { updatedBy: userId }, data: { updatedBy: null } }),
      this.prisma.userStudyPlanEnrollment.updateMany({
        where: { userId },
        data: { createdBy: null, updatedBy: null },
      }),
      this.prisma.subjectAttempt.updateMany({
        where: { enrollment: { userId } },
        data: { createdBy: null, updatedBy: null },
      }),
      this.prisma.evaluationInstance.updateMany({
        where: { attempt: { enrollment: { userId } } },
        data: { createdBy: null, updatedBy: null },
      }),
      this.prisma.finalExam.updateMany({
        where: { attempt: { enrollment: { userId } } },
        data: { createdBy: null, updatedBy: null },
      }),
    ]);

    return { ok: true };
  }

  async export(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        displayName: true,
        isPublic: true,
        isEmailVerified: true,
        acceptedPrivacyAt: true,
        createdAt: true,
      },
    });

    if (!user) ERR.notFound();

    const enrollments = await this.prisma.userStudyPlanEnrollment.findMany({
      where: { userId },
      select: {
        id: true,
        createdAt: true,
        studyPlan: {
          select: {
            id: true,
            year: true,
            requiredElectives: true,
            career: { select: { name: true, university: { select: { name: true } } } },
          },
        },
        attempts: {
          select: {
            id: true,
            status: true,
            finalGrade: true,
            minRegularize: true,
            minPromote: true,
            termYear: true,
            term: true,
            annulledAt: true,
            createdAt: true,
            subject: { select: { id: true, name: true, isElective: true, requiresFinal: true } },
            instances: {
              select: {
                id: true,
                type: true,
                customTypeName: true,
                grade: true,
                examDate: true,
                sortOrder: true,
                retakes: { select: { id: true, grade: true, examDate: true, createdAt: true } },
              },
            },
            finalExams: {
              select: { id: true, grade: true, examDate: true, isExternalExam: true, createdAt: true },
            },
          },
        },
      },
    });

    return { user, enrollments };
  }
}
