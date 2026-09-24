import { Body, Controller, Param, Post, Put, Req } from "@nestjs/common";
import type { Request } from "express";
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
}
