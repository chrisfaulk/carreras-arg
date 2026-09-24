import { Module } from "@nestjs/common";
import { PrismaService } from "../../prisma.service";
import { EvaluationController } from "./evaluation.controller";
import { EvaluationService } from "./evaluation.service";

@Module({
  controllers: [EvaluationController],
  providers: [EvaluationService, PrismaService],
  exports: [EvaluationService],
})
export class EvaluationModule {}
