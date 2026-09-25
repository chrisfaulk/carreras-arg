import { Injectable } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { IdentityService } from "./identity.service";

@Injectable()
export class PrivacyCronService {
  constructor(private readonly identity: IdentityService) {}

  // ponytail: 06:00 UTC = 03:00 ART. UTC fijo, sin timezone con nombre (frágil según ICU del host).
  @Cron("0 6 * * *")
  async purge(): Promise<void> {
    await this.identity.purgeDeletedUsers();
  }
}
