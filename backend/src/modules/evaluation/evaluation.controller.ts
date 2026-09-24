import { Body, Controller, Delete, Get, Param, Post, Put, Req } from "@nestjs/common";
import type { Request } from "express";
import {
  EvaluationService,
  InstanceInput,
  InstanceUpdateInput,
  instanceSchema,
  instanceUpdateSchema,
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
}
