import { Prisma } from "@prisma/client";
import { z } from "zod";

export const instanceSchema = z.object({
  type: z.enum(["PARTIAL", "PRACTICAL_WORK", "DELIVERABLE", "OTHER"]),
  customTypeName: z.string().min(1).max(120).optional(),
  grade: z.number().int().min(1).max(10).optional(),
  examDate: z.string().date().optional(),
  sortOrder: z.number().int().min(0).optional(),
});

export type InstanceInput = z.input<typeof instanceSchema>;

export type InstanceData = z.infer<typeof instanceSchema>;

export const instanceUpdateSchema = z.object({
  type: z.enum(["PARTIAL", "PRACTICAL_WORK", "DELIVERABLE", "OTHER"]).optional(),
  customTypeName: z.string().min(1).max(120).nullable().optional(),
  grade: z.number().int().min(1).max(10).nullable().optional(),
  examDate: z.string().date().nullable().optional(),
  sortOrder: z.number().int().min(0).optional(),
});

export type InstanceUpdateInput = z.input<typeof instanceUpdateSchema>;

export type InstanceUpdateData = z.infer<typeof instanceUpdateSchema>;

export const retakeSchema = z.object({
  grade: z.number().int().min(1).max(10),
  examDate: z.string().date().optional(),
});

export type RetakeInput = z.input<typeof retakeSchema>;

export type RetakeData = z.infer<typeof retakeSchema>;

export const finalExamSchema = z.object({
  grade: z.number().int().min(1).max(10).optional(),
  examDate: z.string().date().optional(),
  isExternalExam: z.boolean().default(false),
});

export type FinalExamInput = z.input<typeof finalExamSchema>;

export type FinalExamData = z.infer<typeof finalExamSchema>;

export const finalExamUpdateSchema = z.object({
  grade: z.number().int().min(1).max(10).nullable().optional(),
  examDate: z.string().date().nullable().optional(),
  isExternalExam: z.boolean().optional(),
});

export type FinalExamUpdateInput = z.input<typeof finalExamUpdateSchema>;

export type FinalExamUpdateData = z.infer<typeof finalExamUpdateSchema>;

export const instanceSelect = {
  id: true,
  subjectAttemptId: true,
  type: true,
  customTypeName: true,
  grade: true,
  examDate: true,
  sortOrder: true,
} satisfies Prisma.EvaluationInstanceSelect;

export const retakeSelect = {
  id: true,
  evaluationInstanceId: true,
  grade: true,
  examDate: true,
} satisfies Prisma.EvaluationRetakeSelect;

export const finalExamSelect = {
  id: true,
  subjectAttemptId: true,
  grade: true,
  examDate: true,
  isExternalExam: true,
} satisfies Prisma.FinalExamSelect;
