import { Body, Controller, Get, Post, Req } from "@nestjs/common";
import type { Request } from "express";
import { EnrollInput, EnrollmentService, enrollSchema } from "./enrollment.service";

@Controller("enrollments")
export class EnrollmentController {
  constructor(private readonly enrollments: EnrollmentService) {}

  @Post()
  enroll(@Req() req: Request, @Body() body: EnrollInput) {
    return this.enrollments.enroll(req.user.id, enrollSchema.parse(body));
  }

  @Get("me")
  mine(@Req() req: Request) {
    return this.enrollments.listMine(req.user.id);
  }
}
