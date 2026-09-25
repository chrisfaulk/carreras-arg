import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { PrismaService } from "../../prisma.service";
import { ERR, OkResult } from "../../shared/api-error";
import { ListQuery, Paged, paged, pagination } from "../../shared/pagination";
import { hasPath, buildAdj } from "./correlative-graph";
import { assertNoChildren, createWithAudit, throwDuplicate, writeWithAudit } from "./admin-write";

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

@Injectable()
export class CatalogService {
  constructor(private readonly prisma: PrismaService) {}

  private write<T>(
    actorId: string,
    action: string,
    entity: string,
    entityId: string,
    diff: Prisma.InputJsonValue,
    fn: (tx: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T> {
    return writeWithAudit(this.prisma, actorId, action, entity, entityId, diff, fn);
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
      return await createWithAudit(this.prisma, actorId, "university", { name: data.name }, (tx) =>
        tx.university.create({
          data: { name: data.name, createdBy: actorId },
          select: { id: true, name: true },
        }),
      );
    } catch (cause) {
      throwDuplicate(cause, "DUPLICATE", "Universidad duplicada");
    }
  }

  updateUniversity(actorId: string, id: string, data: UniversityData) {
    return this.write(actorId, "UPDATE", "university", id, { name: data.name }, (t) =>
      t.university.update({
        where: { id },
        data: { name: data.name, updatedBy: actorId },
        select: { id: true, name: true },
      }),
    );
  }

  async deleteUniversity(actorId: string, id: string): Promise<OkResult> {
    assertNoChildren(
      await this.prisma.career.count({ where: { universityId: id } }),
      "DELETE_BLOCKED_BY_CHILDREN",
      "Tiene carreras asociadas",
    );

    await this.write(actorId, "DELETE", "university", id, {}, (t) => t.university.delete({ where: { id } }));

    return { ok: true };
  }

  async listCareers(query: ListQuery) {
    if (query.includePlans === "1") return this.listCareersWithPlans(query);

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

  async listCareersWithPlans(query: ListQuery) {
    const { page, limit, skip } = pagination(query);
    const where: Prisma.CareerWhereInput = {};

    if (query.universityId) where.universityId = query.universityId;

    if (query.q) where.name = { startsWith: query.q, mode: "insensitive" };

    return this.prisma.$transaction(async (t) => {
      const [careers, total] = await Promise.all([
        t.career.findMany({
          where,
          skip,
          take: limit,
          orderBy: { name: "asc" },
          select: {
            id: true,
            name: true,
            universityId: true,
            university: { select: { id: true, name: true } },
          },
        }),
        t.career.count({ where }),
      ]);

      const plans =
        careers.length > 0
          ? await t.studyPlan.findMany({
              where: { careerId: { in: careers.map((career) => career.id) } },
              orderBy: { year: "desc" },
              select: { id: true, careerId: true, year: true, requiredElectives: true },
            })
          : [];

      const byCareer = new Map<string, typeof plans>();

      for (const plan of plans) {
        const current = byCareer.get(plan.careerId);

        if (current) current.push(plan);
        else byCareer.set(plan.careerId, [plan]);
      }

      return paged(
        careers.map((career) => ({ ...career, plans: byCareer.get(career.id) ?? [] })),
        total,
        page,
        limit,
      );
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
      return await createWithAudit(
        this.prisma,
        actorId,
        "career",
        { name: data.name, universityId: data.universityId },
        (tx) =>
          tx.career.create({
            data: { name: data.name, universityId: data.universityId, createdBy: actorId },
            select: { id: true, name: true, universityId: true },
          }),
      );
    } catch (cause) {
      throwDuplicate(cause, "DUPLICATE", "Carrera duplicada en esa universidad");
    }
  }

  updateCareer(actorId: string, id: string, data: UniversityData) {
    return this.write(actorId, "UPDATE", "career", id, { name: data.name }, (t) =>
      t.career.update({
        where: { id },
        data: { name: data.name, updatedBy: actorId },
        select: { id: true, name: true, universityId: true },
      }),
    );
  }

  async deleteCareer(actorId: string, id: string): Promise<OkResult> {
    assertNoChildren(
      await this.prisma.studyPlan.count({ where: { careerId: id } }),
      "DELETE_BLOCKED_BY_CHILDREN",
      "Tiene planes asociados",
    );

    await this.write(actorId, "DELETE", "career", id, {}, (t) => t.career.delete({ where: { id } }));

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
      return await createWithAudit(
        this.prisma,
        actorId,
        "study_plan",
        { careerId: data.careerId, year: data.year },
        (tx) =>
          tx.studyPlan.create({
            data: {
              careerId: data.careerId,
              year: data.year,
              requiredElectives: data.requiredElectives,
              createdBy: actorId,
            },
            select: { id: true, careerId: true, year: true, requiredElectives: true },
          }),
      );
    } catch (cause) {
      throwDuplicate(cause, "DUPLICATE", "Plan duplicado para esa carrera");
    }
  }

  updatePlan(actorId: string, id: string, data: PlanUpdateData) {
    const diff = prune([
      ["year", data.year],
      ["requiredElectives", data.requiredElectives],
    ]);

    return this.write(actorId, "UPDATE", "study_plan", id, diff, (t) =>
      t.studyPlan.update({ where: { id }, data: { ...data, updatedBy: actorId } }),
    );
  }

  async deletePlan(actorId: string, id: string): Promise<OkResult> {
    assertNoChildren(
      await this.prisma.userStudyPlanEnrollment.count({ where: { studyPlanId: id } }),
      "DELETE_BLOCKED_BY_CHILDREN",
      "Tiene inscriptos",
    );

    await this.write(actorId, "DELETE", "study_plan", id, {}, (t) => t.studyPlan.delete({ where: { id } }));

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
      return await createWithAudit(
        this.prisma,
        actorId,
        "subject",
        { name: data.name, studyPlanId: data.studyPlanId },
        (tx) =>
          tx.subject.create({
            data: {
              name: data.name,
              studyPlanId: data.studyPlanId,
              isElective: data.isElective,
              requiresFinal: data.requiresFinal,
              createdBy: actorId,
            },
            select: { id: true, studyPlanId: true, name: true, isElective: true, requiresFinal: true },
          }),
      );
    } catch (cause) {
      throwDuplicate(cause, "DUPLICATE", "Materia duplicada en ese plan");
    }
  }

  updateSubject(actorId: string, id: string, data: SubjectUpdateData) {
    const diff = prune([
      ["name", data.name],
      ["isElective", data.isElective],
      ["requiresFinal", data.requiresFinal],
    ]);

    return this.write(actorId, "UPDATE", "subject", id, diff, (t) =>
      t.subject.update({ where: { id }, data: { ...data, updatedBy: actorId } }),
    );
  }

  async deleteSubject(actorId: string, id: string): Promise<OkResult> {
    assertNoChildren(
      await this.prisma.subjectAttempt.count({ where: { subjectId: id } }),
      "DELETE_BLOCKED_BY_CHILDREN",
      "Tiene cursadas asociadas",
    );

    await this.write(actorId, "DELETE", "subject", id, {}, async (t) => {
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

    if (await this.reaches(data.correlativeSubjectId, id, subject!.studyPlanId))
      ERR.unprocessable("CYCLIC_CORRELATIVE", "Ciclo detectado");

    try {
      return await createWithAudit(
        this.prisma,
        actorId,
        "subject_correlative",
        { correlativeSubjectId: data.correlativeSubjectId, type: data.type, subjectId: id },
        async (tx) => {
          const row = await tx.subjectCorrelative.create({
            data: { subjectId: id, correlativeSubjectId: data.correlativeSubjectId, type: data.type },
          });

          return { id: row.id.toString(), correlativeSubjectId: data.correlativeSubjectId, type: data.type };
        },
      );
    } catch (cause) {
      throwDuplicate(cause, "DUPLICATE", "Correlativa duplicada");
    }
  }

  async removeCorrelative(actorId: string, id: string, correlativeId: string): Promise<OkResult> {
    await this.write(actorId, "DELETE", "subject_correlative", id, { correlativeSubjectId: correlativeId }, (t) =>
      t.subjectCorrelative.deleteMany({ where: { subjectId: id, correlativeSubjectId: correlativeId } }),
    );

    return { ok: true };
  }

  private async reaches(from: string, target: string, planId: string): Promise<boolean> {
    const edges = await this.prisma.subjectCorrelative.findMany({
      where: { subject: { studyPlanId: planId } },
      select: { subjectId: true, correlativeSubjectId: true },
    });

    return hasPath(buildAdj(edges), from, target);
  }
}
