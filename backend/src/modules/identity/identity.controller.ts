import { Body, Controller, Get, Post, Query } from "@nestjs/common";
import { Public } from "./guards";
import { IdentityService, RegisterInput, registerSchema } from "./identity.service";

@Controller()
export class IdentityController {
  constructor(private readonly identity: IdentityService) {}

  @Public()
  @Post("auth/register")
  register(@Body() body: RegisterInput) {
    return this.identity.register(registerSchema.parse(body));
  }

  @Public()
  @Get("auth/verify")
  verify(@Query("token") token: string) {
    return this.identity.verify(token);
  }
}
