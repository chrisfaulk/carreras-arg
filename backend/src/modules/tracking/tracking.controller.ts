import { Body, Controller, Post, Param, Req } from "@nestjs/common";
import type { Request } from "express";
import { CreateAttemptInput, TrackingService, createAttemptSchema } from "./tracking.service";

@Controller()
export class TrackingController {
  constructor(private readonly tracking: TrackingService) {}

  @Post("enrollments/:enrollmentId/attempts")
  createAttempt(@Req() req: Request, @Param("enrollmentId") enrollmentId: string, @Body() body: CreateAttemptInput) {
    return this.tracking.createAttempt(req.user.id, enrollmentId, createAttemptSchema.parse(body));
  }
}
