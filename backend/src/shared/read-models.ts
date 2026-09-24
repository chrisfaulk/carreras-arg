import { Prisma } from "@prisma/client";
import { ERR } from "./api-error";

export interface LockedEnrollment {
  id: string;
  userId: string;
  studyPlanId: string;
}

export async function lockedEnrollment(
  tx: Prisma.TransactionClient,
  enrollmentId: string,
  userId: string,
): Promise<LockedEnrollment> {
  const rows = await tx.$queryRaw<Array<{ id: string; user_id: string; study_plan_id: string }>>`
    SELECT id, user_id, study_plan_id FROM user_study_plan_enrollment WHERE id = ${enrollmentId}::uuid FOR UPDATE`;

  const row = rows[0];

  if (!row || row.user_id !== userId) ERR.notFound();

  return { id: row!.id, userId: row!.user_id, studyPlanId: row!.study_plan_id };
}
