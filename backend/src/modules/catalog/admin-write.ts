import { Prisma } from "@prisma/client";
import { ERR } from "../../shared/api-error";
import type { PrismaService } from "../../prisma.service";

export function isDuplicate(error: unknown): error is Prisma.PrismaClientKnownRequestError {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

export function throwDuplicate(cause: unknown, code: string, message: string): never {
  if (isDuplicate(cause)) ERR.conflict(code, message);

  throw cause;
}

export function assertNoChildren(count: number, code: string, message: string): void {
  if (count > 0) ERR.conflict(code, message);
}

export function writeWithAudit<T>(
  prisma: PrismaService,
  actorId: string,
  action: string,
  entity: string,
  entityId: string,
  diff: Prisma.InputJsonValue,
  fn: (tx: Prisma.TransactionClient) => Promise<T>,
): Promise<T> {
  return prisma.$transaction(async (tx) => {
    const out = await fn(tx);

    await tx.auditLog.create({ data: { actorId, action, entity, entityId, diffJson: diff } });

    return out;
  });
}

export async function createWithAudit<T extends { id: string }>(
  prisma: PrismaService,
  actorId: string,
  entity: string,
  diff: Prisma.InputJsonValue,
  create: (tx: Prisma.TransactionClient) => Promise<T>,
): Promise<T> {
  return prisma.$transaction(async (tx) => {
    const row = await create(tx);

    await tx.auditLog.create({
      data: { actorId, action: "CREATE", entity, entityId: row.id, diffJson: diff },
    });

    return row;
  });
}
