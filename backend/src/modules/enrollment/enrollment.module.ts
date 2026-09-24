import { Module } from "@nestjs/common";
import { PrismaService } from "../../prisma.service";
import { EnrollmentController } from "./enrollment.controller";
import { EnrollmentService } from "./enrollment.service";

@Module({
  controllers: [EnrollmentController],
  providers: [EnrollmentService, PrismaService],
  exports: [EnrollmentService],
})
export class EnrollmentModule {}
