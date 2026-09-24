import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { PrismaService } from "../../prisma.service";
import { ERR, OkResult } from "../../shared/api-error";
import { ListQuery, Paged, paged, pagination } from "../../shared/pagination";

export const universitySchema = z.object({ name: z.string().min(1).max(120) });

export type UniversityInput = z.input<typeof universitySchema>;

export type UniversityData = z.infer<typeof universitySchema>;

async function audit(
  tx: Prisma.TransactionClient,
  actorId: string,
  action: string,
  entity: string,
  entityId: string,
  diff: Prisma.InputJsonValue,
): Promise<void> {
  await tx.auditLog.create({ data: { actorId, action, entity, entityId, diffJson: diff } });
}

function isDuplicate(error: unknown): error is Prisma.PrismaClientKnownRequestError {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

@Injectable()
export class CatalogService {
  constructor(private readonly prisma: PrismaService) {}

  private tx<T>(
    actorId: string,
    action: string,
    entity: string,
    entityId: string,
    diff: Prisma.InputJsonValue,
    fn: (tx: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T> {
    return this.prisma.$transaction(async (t) => {
      const out = await fn(t);

      await audit(t, actorId, action, entity, entityId, diff);

      return out;
    });
  }

  async listUniversities(query: ListQuery): Promise<Paged<{ id: string; name: string }>> {
    const { page, limit, skip } = pagination(query);

    const where: Prisma.UniversityWhereInput = query.q ? { name: { startsWith: query.q, mode: "insensitive" } } : {};

    return this.prisma.$transaction(async (t) => {
      const [data, total] = await Promise.all([
        t.university.findMany({
          where,
          skip,
          take: limit,
          orderBy: { name: "asc" },
          select: { id: true, name: true },
        }),
        t.university.count({ where }),
      ]);

      return paged(data, total, page, limit);
    });
  }

  async createUniversity(actorId: string, data: UniversityData) {
    try {
      const row = await this.prisma.university.create({
        data: { name: data.name, createdBy: actorId },
        select: { id: true, name: true },
      });

      await this.prisma.auditLog.create({
        data: {
          actorId,
          action: "CREATE",
          entity: "university",
          entityId: row.id,
          diffJson: { name: data.name },
        },
      });

      return row;
    } catch (error) {
      if (isDuplicate(error)) ERR.conflict("DUPLICATE", "Universidad duplicada");

      throw error;
    }
  }

  updateUniversity(actorId: string, id: string, data: UniversityData) {
    return this.tx(actorId, "UPDATE", "university", id, { name: data.name }, (t) =>
      t.university.update({
        where: { id },
        data: { name: data.name, updatedBy: actorId },
        select: { id: true, name: true },
      }),
    );
  }

  async deleteUniversity(actorId: string, id: string): Promise<OkResult> {
    const kids = await this.prisma.career.count({ where: { universityId: id } });

    if (kids > 0) ERR.conflict("DELETE_BLOCKED_BY_CHILDREN", "Tiene carreras asociadas");

    await this.tx(actorId, "DELETE", "university", id, {}, (t) => t.university.delete({ where: { id } }));

    return { ok: true };
  }
}
