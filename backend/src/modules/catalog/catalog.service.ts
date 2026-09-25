import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { PrismaService } from "../../prisma.service";
import { ERR, OkResult } from "../../shared/api-error";
import { ListQuery, Paged, paged, pagination } from "../../shared/pagination";
import { hasPath } from "./correlative-graph";

export const universitySchema = z.object({ name: z.string().min(1).max(120) });

export const careerSchema = universitySchema.extend({ universityId: z.string().uuid() });

export const planSchema = z.object({
  careerId: z.string().uuid(),
  year: z.number().int(),
  requiredElectives: z.number().int().min(0).default(0),
});

export const planUpdateSchema = z.object({
  year: z.number().int().optional(),
  requiredElectives: z.number().int().min(0).optional(),
});

export const subjectSchema = universitySchema.extend({
  studyPlanId: z.string().uuid(),
  isElective: z.boolean().default(false),
  requiresFinal: z.boolean().default(true),
});

export const subjectUpdateSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  isElective: z.boolean().optional(),
  requiresFinal: z.boolean().optional(),
});

export const correlativeSchema = z.object({
  correlativeSubjectId: z.string().uuid(),
  type: z.enum(["PREVIOUS", "CONCURRENT"]),
});

export type UniversityInput = z.input<typeof universitySchema>;

export type UniversityData = z.infer<typeof universitySchema>;

export type CareerInput = z.input<typeof careerSchema>;

export type CareerData = z.infer<typeof careerSchema>;

export type PlanInput = z.input<typeof planSchema>;

export type PlanData = z.infer<typeof planSchema>;

export type PlanUpdateInput = z.input<typeof planUpdateSchema>;

export type PlanUpdateData = z.infer<typeof planUpdateSchema>;

export type SubjectInput = z.input<typeof subjectSchema>;

export type SubjectData = z.infer<typeof subjectSchema>;

export type SubjectUpdateInput = z.input<typeof subjectUpdateSchema>;

export type SubjectUpdateData = z.infer<typeof subjectUpdateSchema>;

export type CorrelativeInput = z.input<typeof correlativeSchema>;

export type CorrelativeData = z.infer<typeof correlativeSchema>;

export interface CorrelativeRow {
  correlativeSubjectId: string;
  type: "PREVIOUS" | "CONCURRENT";
}

type JsonField = string | number | boolean | undefined;

type JsonEntry = [string, Exclude<JsonField, undefined>];

function prune(fields: Array<[string, JsonField]>): Prisma.InputJsonValue {
  const kept = fields.flatMap((entry): JsonEntry[] => {
    if (entry[1] === undefined) return [];

    return [[entry[0], entry[1]]];
  });

  return Object.fromEntries(kept);
}

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

  async getUniversity(id: string) {
    const row = await this.prisma.university.findUnique({
      where: { id },
      select: { id: true, name: true },
    });

    if (!row) ERR.notFound();

    return row;
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

  async listCareers(query: ListQuery) {
    const { page, limit, skip } = pagination(query);
    const where: Prisma.CareerWhereInput = {};

    if (query.universityId) where.universityId = query.universityId;

    if (query.q) where.name = { startsWith: query.q, mode: "insensitive" };

    return this.prisma.$transaction(async (t) => {
      const [data, total] = await Promise.all([
        t.career.findMany({
          where,
          skip,
          take: limit,
          orderBy: { name: "asc" },
          select: { id: true, name: true, universityId: true },
        }),
        t.career.count({ where }),
      ]);

      return paged(data, total, page, limit);
    });
  }

  async getCareer(id: string) {
    const row = await this.prisma.career.findUnique({
      where: { id },
      select: { id: true, name: true, university: { select: { id: true, name: true } } },
    });

    if (!row) ERR.notFound();

    return row;
  }

  async createCareer(actorId: string, data: CareerData) {
    try {
      const row = await this.prisma.career.create({
        data: { name: data.name, universityId: data.universityId, createdBy: actorId },
        select: { id: true, name: true, universityId: true },
      });

      await this.prisma.auditLog.create({
        data: {
          actorId,
          action: "CREATE",
          entity: "career",
          entityId: row.id,
          diffJson: { name: data.name, universityId: data.universityId },
        },
      });

      return row;
    } catch (error) {
      if (isDuplicate(error)) ERR.conflict("DUPLICATE", "Carrera duplicada en esa universidad");

      throw error;
    }
  }

  updateCareer(actorId: string, id: string, data: UniversityData) {
    return this.tx(actorId, "UPDATE", "career", id, { name: data.name }, (t) =>
      t.career.update({
        where: { id },
        data: { name: data.name, updatedBy: actorId },
        select: { id: true, name: true, universityId: true },
      }),
    );
  }

  async deleteCareer(actorId: string, id: string): Promise<OkResult> {
    const kids = await this.prisma.studyPlan.count({ where: { careerId: id } });

    if (kids > 0) ERR.conflict("DELETE_BLOCKED_BY_CHILDREN", "Tiene planes asociados");

    await this.tx(actorId, "DELETE", "career", id, {}, (t) => t.career.delete({ where: { id } }));

    return { ok: true };
  }

  async listPlans(query: ListQuery) {
    const { page, limit, skip } = pagination(query);
    const where: Prisma.StudyPlanWhereInput = query.careerId ? { careerId: query.careerId } : {};

    return this.prisma.$transaction(async (t) => {
      const [data, total] = await Promise.all([
        t.studyPlan.findMany({
          where,
          skip,
          take: limit,
          orderBy: { year: "desc" },
          select: { id: true, careerId: true, year: true, requiredElectives: true },
        }),
        t.studyPlan.count({ where }),
      ]);

      return paged(data, total, page, limit);
    });
  }

  async getPlan(id: string) {
    const row = await this.prisma.studyPlan.findUnique({
      where: { id },
      select: {
        id: true,
        year: true,
        requiredElectives: true,
        career: { select: { id: true, name: true, university: { select: { id: true, name: true } } } },
      },
    });

    if (!row) ERR.notFound();

    return row;
  }

  async createPlan(actorId: string, data: PlanData) {
    try {
      const row = await this.prisma.studyPlan.create({
        data: {
          careerId: data.careerId,
          year: data.year,
          requiredElectives: data.requiredElectives,
          createdBy: actorId,
        },
        select: { id: true, careerId: true, year: true, requiredElectives: true },
      });

      await this.prisma.auditLog.create({
        data: {
          actorId,
          action: "CREATE",
          entity: "study_plan",
          entityId: row.id,
          diffJson: { careerId: data.careerId, year: data.year },
        },
      });

      return row;
    } catch (error) {
      if (isDuplicate(error)) ERR.conflict("DUPLICATE", "Plan duplicado para esa carrera");

      throw error;
    }
  }

  updatePlan(actorId: string, id: string, data: PlanUpdateData) {
    const diff = prune([
      ["year", data.year],
      ["requiredElectives", data.requiredElectives],
    ]);

    return this.tx(actorId, "UPDATE", "study_plan", id, diff, (t) =>
      t.studyPlan.update({ where: { id }, data: { ...data, updatedBy: actorId } }),
    );
  }

  async deletePlan(actorId: string, id: string): Promise<OkResult> {
    const kids = await this.prisma.userStudyPlanEnrollment.count({ where: { studyPlanId: id } });

    if (kids > 0) ERR.conflict("DELETE_BLOCKED_BY_CHILDREN", "Tiene inscriptos");

    await this.tx(actorId, "DELETE", "study_plan", id, {}, (t) => t.studyPlan.delete({ where: { id } }));

    return { ok: true };
  }

  async listSubjects(query: ListQuery) {
    const { page, limit, skip } = pagination(query);
    const where: Prisma.SubjectWhereInput = {};

    if (query.studyPlanId) where.studyPlanId = query.studyPlanId;

    if (query.q) where.name = { startsWith: query.q, mode: "insensitive" };

    return this.prisma.$transaction(async (t) => {
      const [data, total] = await Promise.all([
        t.subject.findMany({
          where,
          skip,
          take: limit,
          orderBy: { name: "asc" },
          select: { id: true, studyPlanId: true, name: true, isElective: true, requiresFinal: true },
        }),
        t.subject.count({ where }),
      ]);

      return paged(data, total, page, limit);
    });
  }

  async createSubject(actorId: string, data: SubjectData) {
    try {
      const row = await this.prisma.subject.create({
        data: {
          name: data.name,
          studyPlanId: data.studyPlanId,
          isElective: data.isElective,
          requiresFinal: data.requiresFinal,
          createdBy: actorId,
        },
        select: { id: true, studyPlanId: true, name: true, isElective: true, requiresFinal: true },
      });

      await this.prisma.auditLog.create({
        data: {
          actorId,
          action: "CREATE",
          entity: "subject",
          entityId: row.id,
          diffJson: { name: data.name, studyPlanId: data.studyPlanId },
        },
      });

      return row;
    } catch (error) {
      if (isDuplicate(error)) ERR.conflict("DUPLICATE", "Materia duplicada en ese plan");

      throw error;
    }
  }

  updateSubject(actorId: string, id: string, data: SubjectUpdateData) {
    const diff = prune([
      ["name", data.name],
      ["isElective", data.isElective],
      ["requiresFinal", data.requiresFinal],
    ]);

    return this.tx(actorId, "UPDATE", "subject", id, diff, (t) =>
      t.subject.update({ where: { id }, data: { ...data, updatedBy: actorId } }),
    );
  }

  async deleteSubject(actorId: string, id: string): Promise<OkResult> {
    const kids = await this.prisma.subjectAttempt.count({ where: { subjectId: id } });

    if (kids > 0) ERR.conflict("DELETE_BLOCKED_BY_CHILDREN", "Tiene cursadas asociadas");

    await this.tx(actorId, "DELETE", "subject", id, {}, async (t) => {
      await t.subjectCorrelative.deleteMany({ where: { OR: [{ subjectId: id }, { correlativeSubjectId: id }] } });

      return t.subject.delete({ where: { id } });
    });

    return { ok: true };
  }

  async listCorrelatives(id: string): Promise<Paged<CorrelativeRow>> {
    const rows = await this.prisma.subjectCorrelative.findMany({
      where: { subjectId: id },
      select: { correlativeSubjectId: true, type: true },
    });

    return { data: rows, meta: { page: 1, limit: rows.length, total: rows.length } };
  }

  async addCorrelative(actorId: string, id: string, data: CorrelativeData) {
    if (data.correlativeSubjectId === id) ERR.unprocessable("INVALID_CORRELATIVE", "Sin auto-referencia");

    const [subject, correlative] = await Promise.all([
      this.prisma.subject.findUnique({ where: { id }, select: { studyPlanId: true } }),
      this.prisma.subject.findUnique({ where: { id: data.correlativeSubjectId }, select: { studyPlanId: true } }),
    ]);

    if (!subject || !correlative) ERR.notFound();

    if (subject!.studyPlanId !== correlative!.studyPlanId)
      ERR.unprocessable("INVALID_CORRELATIVE", "Mismo plan requerido");

    if (await this.reaches(data.correlativeSubjectId, id)) ERR.unprocessable("CYCLIC_CORRELATIVE", "Ciclo detectado");

    try {
      const row = await this.prisma.subjectCorrelative.create({
        data: { subjectId: id, correlativeSubjectId: data.correlativeSubjectId, type: data.type },
      });

      await this.prisma.auditLog.create({
        data: {
          actorId,
          action: "CREATE",
          entity: "subject_correlative",
          entityId: id,
          diffJson: { correlativeSubjectId: data.correlativeSubjectId, type: data.type },
        },
      });

      return { id: row.id.toString(), correlativeSubjectId: data.correlativeSubjectId, type: data.type };
    } catch (error) {
      if (isDuplicate(error)) ERR.conflict("DUPLICATE", "Correlativa duplicada");

      throw error;
    }
  }

  async removeCorrelative(actorId: string, id: string, correlativeId: string): Promise<OkResult> {
    await this.tx(actorId, "DELETE", "subject_correlative", id, { correlativeSubjectId: correlativeId }, (t) =>
      t.subjectCorrelative.deleteMany({ where: { subjectId: id, correlativeSubjectId: correlativeId } }),
    );

    return { ok: true };
  }

  private async reaches(from: string, target: string): Promise<boolean> {
    const adj = new Map<string, string[]>();
    const seen = new Set<string>([from]);
    const queue = [from];

    while (queue.length > 0) {
      const cur = queue.shift()!;

      const next = await this.prisma.subjectCorrelative.findMany({
        where: { subjectId: cur },
        select: { correlativeSubjectId: true },
      });

      adj.set(
        cur,
        next.map((n) => n.correlativeSubjectId),
      );

      for (const id of adj.get(cur) ?? []) {
        if (!seen.has(id)) {
          seen.add(id);
          queue.push(id);
        }
      }
    }

    return hasPath(adj, from, target);
  }
}
