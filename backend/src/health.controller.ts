import { Controller, Get } from "@nestjs/common";
import { Public } from "./modules/identity/guards";

interface HealthStatus {
  ok: true;
}

@Controller()
export class HealthController {
  @Public()
  @Get("health")
  health(): HealthStatus {
    return { ok: true };
  }
}
