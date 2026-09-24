import { Body, Controller, Delete, Get, Param, Post, Put, Req } from "@nestjs/common";
import type { Request } from "express";
import {
  EvaluationService,
  FinalExamInput,
  FinalExamUpdateInput,
  InstanceInput,
  InstanceUpdateInput,
  RetakeInput,
  finalExamSchema,
  finalExamUpdateSchema,
  instanceSchema,
  instanceUpdateSchema,
  retakeSchema,
} from "./evaluation.service";

@Controller()
export class EvaluationController {
  constructor(private readonly evaluation: EvaluationService) {}

  @Get("attempts/:id/instances")
  listInstances(@Req() req: Request, @Param("id") id: string) {
    return this.evaluation.listInstances(req.user.id, id);
  }

  @Post("attempts/:id/instances")
  createInstance(@Req() req: Request, @Param("id") id: string, @Body() body: InstanceInput) {
    return this.evaluation.createInstance(req.user.id, id, instanceSchema.parse(body));
  }

  @Put("instances/:id")
  updateInstance(@Req() req: Request, @Param("id") id: string, @Body() body: InstanceUpdateInput) {
    return this.evaluation.updateInstance(req.user.id, id, instanceUpdateSchema.parse(body));
  }

  @Delete("instances/:id")
  deleteInstance(@Req() req: Request, @Param("id") id: string) {
    return this.evaluation.deleteInstance(req.user.id, id);
  }

  @Post("instances/:id/retakes")
  createRetake(@Req() req: Request, @Param("id") id: string, @Body() body: RetakeInput) {
    return this.evaluation.createRetake(req.user.id, id, retakeSchema.parse(body));
  }

  @Delete("retakes/:id")
  deleteRetake(@Req() req: Request, @Param("id") id: string) {
    return this.evaluation.deleteRetake(req.user.id, id);
  }

  @Post("attempts/:id/final-exams")
  createFinalExam(@Req() req: Request, @Param("id") id: string, @Body() body: FinalExamInput) {
    return this.evaluation.createFinalExam(req.user.id, id, finalExamSchema.parse(body));
  }

  @Put("final-exams/:id")
  updateFinalExam(@Req() req: Request, @Param("id") id: string, @Body() body: FinalExamUpdateInput) {
    return this.evaluation.updateFinalExam(req.user.id, id, finalExamUpdateSchema.parse(body));
  }
}
