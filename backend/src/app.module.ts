import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { PrismaService } from "./prisma.service";
import { CatalogModule } from "./modules/catalog/catalog.module";
import { EnrollmentModule } from "./modules/enrollment/enrollment.module";
import { TrackingModule } from "./modules/tracking/tracking.module";
import { IdentityModule } from "./modules/identity/identity.module";
import { HealthController } from "./health.controller";

@Module({
  imports: [
    // ponytail: throttler en memoria, Redis si hay mas de una instancia
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 60 }]),
    IdentityModule,
    CatalogModule,
    EnrollmentModule,
    TrackingModule,
  ],
  controllers: [HealthController],
  providers: [PrismaService, { provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
