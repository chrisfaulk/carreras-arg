import { Controller, Get, Module } from "@nestjs/common";
import { PrismaService } from "./prisma.service";

@Controller()
class AppController {
  @Get("health")
  health() {
    return { ok: true };
  }
}

@Module({ controllers: [AppController], providers: [PrismaService], exports: [PrismaService] })
export class AppModule {}
