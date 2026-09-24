import { Body, Controller, Get, Param, Post, Put, Query, Req } from "@nestjs/common";
import type { Request } from "express";
import { RawListQuery, listQuerySchema } from "../../shared/pagination";
import {
  CreateAttemptInput,
  TrackingService,
  UpdateAttemptInput,
  createAttemptSchema,
  updateAttemptSchema,
} from "./tracking.service";

@Controller()
export class TrackingController {
  constructor(private readonly tracking: TrackingService) {}

  @Post("enrollments/:enrollmentId/attempts")
  createAttempt(@Req() req: Request, @Param("enrollmentId") enrollmentId: string, @Body() body: CreateAttemptInput) {
    return this.tracking.createAttempt(req.user.id, enrollmentId, createAttemptSchema.parse(body));
  }

  @Put("attempts/:id")
  updateAttempt(@Req() req: Request, @Param("id") id: string, @Body() body: UpdateAttemptInput) {
    return this.tracking.updateAttempt(req.user.id, id, updateAttemptSchema.parse(body));
  }

  @Put("attempts/:id/close")
  closeAttempt(@Req() req: Request, @Param("id") id: string) {
    return this.tracking.closeAttempt(req.user.id, id);
  }

  @Get("study-plans/:id/subjects")
  planSubjects(@Req() req: Request, @Param("id") id: string, @Query() query: RawListQuery) {
    return this.tracking.planSubjects(req.user.id, id, listQuerySchema.parse(query));
  }

  @Get("enrollments/:id/cursables")
  cursables(@Req() req: Request, @Param("id") id: string, @Query() query: RawListQuery) {
    return this.tracking.cursables(req.user.id, id, listQuerySchema.parse(query));
  }

  @Get("enrollments/:id/averages")
  averages(@Req() req: Request, @Param("id") id: string) {
    return this.tracking.averages(req.user.id, id);
  }
}
