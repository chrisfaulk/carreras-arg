import { Module } from "@nestjs/common";
import { PrismaService } from "./prisma.service";
import { IdentityModule } from "./modules/identity/identity.module";
import { HealthController } from "./health.controller";

@Module({
  imports: [IdentityModule],
  controllers: [HealthController],
  providers: [PrismaService],
})
export class AppModule {}
