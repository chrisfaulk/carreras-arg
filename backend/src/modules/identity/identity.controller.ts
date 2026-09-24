import { Body, Controller, Get, Post, Put, Query, Req, Res } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import type { Request, Response } from "express";
import { Public } from "./guards";
import { FORGOT_THROTTLE, LOGIN_THROTTLE } from "../../shared/throttling";
import {
  ACCESS_DAYS,
  ForgotInput,
  forgotSchema,
  IdentityService,
  LoginInput,
  loginSchema,
  REFRESH_DAYS,
  RegisterInput,
  registerSchema,
  ResetInput,
  resetSchema,
  SetPasswordInput,
  setPasswordSchema,
  UpdateMeInput,
  updateMeSchema,
  cookieOpts,
} from "./identity.service";

function setSession(res: Response, access: string, refresh: string): void {
  res.cookie("access", access, cookieOpts(ACCESS_DAYS));
  res.cookie("refresh", refresh, cookieOpts(REFRESH_DAYS));
}

function cookie(req: Request, name: string): string | undefined {
  const jar = req.cookies as Record<string, string> | undefined;

  return jar?.[name];
}

function clearSession(res: Response): void {
  res.clearCookie("access", { path: "/" });
  res.clearCookie("refresh", { path: "/" });
}

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

  @Public()
  @Throttle({ default: LOGIN_THROTTLE })
  @Post("auth/login")
  async login(@Body() body: LoginInput, @Res({ passthrough: true }) res: Response) {
    const session = await this.identity.login(loginSchema.parse(body));

    setSession(res, session.access, session.refresh);

    return { ok: true };
  }

  @Public()
  @Post("auth/refresh")
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const session = await this.identity.refresh(cookie(req, "refresh"));

    setSession(res, session.access, session.refresh);

    return { ok: true };
  }

  @Post("auth/logout")
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    await this.identity.logout(cookie(req, "refresh"));

    clearSession(res);

    return { ok: true };
  }

  @Public()
  @Throttle({ default: FORGOT_THROTTLE })
  @Post("auth/forgot")
  forgot(@Body() body: ForgotInput) {
    return this.identity.forgot(forgotSchema.parse(body));
  }

  @Public()
  @Post("auth/reset")
  reset(@Body() body: ResetInput) {
    return this.identity.reset(resetSchema.parse(body));
  }

  @Post("auth/password")
  setPassword(@Req() req: Request, @Body() body: SetPasswordInput) {
    return this.identity.setPassword(req.user.id, setPasswordSchema.parse(body));
  }

  @Put("users/me")
  updateMe(@Req() req: Request, @Body() body: UpdateMeInput) {
    return this.identity.updateMe(req.user.id, updateMeSchema.parse(body));
  }

  @Public()
  @Get("auth/google")
  google() {
    return this.identity.googleUrl();
  }

  @Public()
  @Get("auth/google/callback")
  async googleCallback(@Query("code") code: string, @Res({ passthrough: true }) res: Response) {
    const session = await this.identity.googleCallback(code);

    setSession(res, session.access, session.refresh);

    return { ok: true };
  }
}
