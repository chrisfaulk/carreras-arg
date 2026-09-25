import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { ScheduleModule } from "@nestjs/schedule";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { PrismaService } from "./prisma.service";
import { CatalogModule } from "./modules/catalog/catalog.module";
import { EnrollmentModule } from "./modules/enrollment/enrollment.module";
import { EvaluationModule } from "./modules/evaluation/evaluation.module";
import { TrackingModule } from "./modules/tracking/tracking.module";
import { IdentityModule } from "./modules/identity/identity.module";
import { HealthController } from "./health.controller";

@Module({
  imports: [
    // throttler en memoria, Redis si hay mas de una instancia
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 60 }]),
    ScheduleModule.forRoot(),
    IdentityModule,
    CatalogModule,
    EnrollmentModule,
    TrackingModule,
    EvaluationModule,
  ],
  controllers: [HealthController],
  providers: [PrismaService, { provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
