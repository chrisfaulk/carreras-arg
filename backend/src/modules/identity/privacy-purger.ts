import type { PrismaService } from "../../prisma.service";

export const PURGE_AFTER_DAYS = 30;

export function purgeCutoff(now: Date = new Date()): Date {
  return new Date(now.getTime() - PURGE_AFTER_DAYS * 24 * 60 * 60 * 1000);
}

function chunks<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];

  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));

  return out;
}

export async function purgeDeletedBatch(prisma: PrismaService, now: Date = new Date()): Promise<{ purged: number }> {
  const users = await prisma.user.findMany({
    where: { deletedAt: { lt: purgeCutoff(now) } },
    select: { id: true },
  });

  if (users.length === 0) return { purged: 0 };

  for (const batch of chunks(
    users.map((user) => user.id),
    100,
  )) {
    await prisma.$transaction([
      prisma.finalExam.deleteMany({ where: { attempt: { enrollment: { userId: { in: batch } } } } }),
      prisma.evaluationRetake.deleteMany({
        where: { instance: { attempt: { enrollment: { userId: { in: batch } } } } },
      }),
      prisma.evaluationInstance.deleteMany({
        where: { attempt: { enrollment: { userId: { in: batch } } } },
      }),
      prisma.subjectAttempt.deleteMany({ where: { enrollment: { userId: { in: batch } } } }),
      prisma.userStudyPlanEnrollment.deleteMany({ where: { userId: { in: batch } } }),
      prisma.refreshToken.deleteMany({ where: { userId: { in: batch } } }),
      prisma.auditLog.updateMany({ where: { actorId: { in: batch } }, data: { actorId: null } }),
      prisma.user.deleteMany({ where: { id: { in: batch } } }),
    ]);
  }

  return { purged: users.length };
}
