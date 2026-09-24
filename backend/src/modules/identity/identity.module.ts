import { Module, OnModuleInit } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { PrismaService } from "../../prisma.service";
import { AdminGuard, AuthGuard } from "./guards";
import { IdentityController } from "./identity.controller";
import { IdentityService } from "./identity.service";

@Module({
  controllers: [IdentityController],
  providers: [IdentityService, PrismaService, { provide: APP_GUARD, useClass: AuthGuard }],
  exports: [IdentityService],
})
export class IdentityModule implements OnModuleInit {
  constructor(private readonly identity: IdentityService) {}

  async onModuleInit(): Promise<void> {
    await this.identity.seedAdmin();
  }
}

export { AdminGuard };
