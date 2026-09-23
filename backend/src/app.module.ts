import { Controller, Get, Module } from "@nestjs/common";

@Controller()
class AppController {
  @Get("health")
  health() {
    return { ok: true };
  }
}

@Module({ controllers: [AppController] })
export class AppModule {}
