import { z } from "zod";

export interface RawListQuery {
  page?: string;
  limit?: string;
  q?: string;
  universityId?: string;
  careerId?: string;
  studyPlanId?: string;
  status?: string;
}

export const visibleStatusSchema = z.enum(["NOT_AVAILABLE", "AVAILABLE", "PENDING_FINAL", "IN_PROGRESS", "PASSED"]);

export const listQuerySchema = z.object({
  page: z.coerce
    .number()
    .int()
    .default(1)
    .transform((v) => Math.max(1, v)),
  limit: z.coerce
    .number()
    .int()
    .default(20)
    .transform((v) => Math.min(50, Math.max(1, v))),
  q: z.string().min(1).max(120).optional(),
  universityId: z.string().uuid().optional(),
  careerId: z.string().uuid().optional(),
  studyPlanId: z.string().uuid().optional(),
  status: visibleStatusSchema.optional(),
});

export type ListQuery = z.infer<typeof listQuerySchema>;

export interface Paged<T> {
  data: T[];
  meta: { page: number; limit: number; total: number };
}

export interface PageSlice {
  page: number;
  limit: number;
  skip: number;
}

export function pagination(query: ListQuery): PageSlice {
  return { page: query.page, limit: query.limit, skip: (query.page - 1) * query.limit };
}

export function paged<T>(data: T[], total: number, page: number, limit: number): Paged<T> {
  return { data, meta: { page, limit, total } };
}
