import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma.service";
import { ERR, IdResult, OkResult } from "../../shared/api-error";
import { sendMail } from "../../shared/mail";
import { checkToken, signToken, tokenIat } from "../../shared/tokens";
import { comparePassword, hashPassword } from "./guards";
import { ACCESS_MAX_AGE_MS, REFRESH_MAX_AGE_MS, cookieOpts } from "./cookies";
import {
  ForgotData,
  GoogleAuthUrl,
  GoogleSession,
  LoginData,
  RegisterData,
  ResetData,
  Session,
  SetPasswordData,
  UpdateMeData,
} from "./dto";
import { GoogleOAuth } from "./oauth-google";
import { PrivacyService } from "./privacy.service";
import { SessionManager } from "./session-manager";
import { PURGE_AFTER_DAYS, purgeCutoff, purgeDeletedBatch } from "./privacy-purger";

export * from "./dto";

export { ACCESS_MAX_AGE_MS, REFRESH_MAX_AGE_MS, cookieOpts };

export { PURGE_AFTER_DAYS, purgeCutoff };

export { ACCESS_MAX_AGE_MS as ACCESS_DAYS, REFRESH_MAX_AGE_MS as REFRESH_DAYS };

@Injectable()
export class IdentityService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sessions: SessionManager,
    private readonly oauth: GoogleOAuth,
    private readonly privacy: PrivacyService,
  ) {}

  async register(data: RegisterData): Promise<IdResult> {
    const exists = await this.prisma.user.findFirst({
      where: { OR: [{ email: data.email }, { username: data.username }] },
      select: { id: true },
    });

    if (exists) ERR.conflict("DUPLICATE", "Email o username en uso");

    const passwordHash = await hashPassword(data.password);

    const user = await this.prisma.user.create({
      data: {
        email: data.email,
        username: data.username,
        displayName: data.displayName,
        passwordHash,
        acceptedPrivacyAt: new Date(),
      },
      select: { id: true },
    });

    const token = signToken(user.id, "verify");

    await sendMail(
      data.email,
      "Verificá tu cuenta",
      `Activá tu cuenta: /api/auth/verify?token=${token} (vence en 24h).`,
    );

    return user;
  }

  async verify(token: string): Promise<OkResult> {
    let sub: string;

    try {
      sub = checkToken(token, "verify");
    } catch {
      ERR.bad("Token de verificación inválido o vencido");
    }

    await this.prisma.user.updateMany({
      where: { id: sub!, isEmailVerified: false },
      data: { isEmailVerified: true },
    });

    return { ok: true };
  }

  async login(data: LoginData): Promise<Session> {
    const user = await this.prisma.user.findUnique({ where: { email: data.email } });

    if (!user || user.deletedAt) ERR.unauth();

    if (!user!.passwordHash) ERR.unauth();

    if (!(await comparePassword(data.password, user!.passwordHash!))) ERR.unauth();

    if (!user!.isEmailVerified) ERR.forbidden();

    return this.sessions.create(user!.id);
  }

  refresh(raw: string | undefined): Promise<Session> {
    return this.sessions.rotate(raw);
  }

  logout(raw: string | undefined): Promise<OkResult> {
    return this.sessions.logout(raw);
  }

  async forgot(data: ForgotData): Promise<OkResult> {
    const user = await this.prisma.user.findUnique({ where: { email: data.email }, select: { id: true } });

    if (user) {
      const token = signToken(user.id, "reset");

      await sendMail(data.email, "Restablecé tu contraseña", `Usá este link (1h): /api/auth/reset?token=${token}`);
    }

    return { ok: true };
  }

  async reset(data: ResetData): Promise<OkResult> {
    let sub: string;

    try {
      sub = checkToken(data.token, "reset");
    } catch {
      ERR.bad("Token inválido o vencido");
    }

    const user = await this.prisma.user.findUnique({ where: { id: sub! } });

    if (!user) ERR.notFound();

    if (user!.updatedAt.getTime() / 1000 > tokenIat(data.token)) ERR.bad("Token inválido o vencido");

    await this.prisma.user.update({
      where: { id: sub! },
      data: { passwordHash: await hashPassword(data.password) },
    });

    await this.sessions.revokeAll(sub!);

    return { ok: true };
  }

  async setPassword(userId: string, data: SetPasswordData): Promise<OkResult> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: await hashPassword(data.password) },
    });

    return { ok: true };
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true, email: true, displayName: true, isPublic: true },
    });

    if (!user) ERR.notFound();

    return user;
  }

  async updateMe(userId: string, data: UpdateMeData) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { displayName: data.displayName, isPublic: data.isPublic },
      select: { id: true, username: true, email: true, displayName: true, isPublic: true },
    });
  }

  deleteMe(userId: string): Promise<OkResult> {
    return this.privacy.softDelete(userId);
  }

  exportMe(userId: string) {
    return this.privacy.export(userId);
  }

  purgeDeletedUsers(now: Date = new Date()): Promise<{ purged: number }> {
    return purgeDeletedBatch(this.prisma, now);
  }

  googleUrl(): GoogleAuthUrl {
    return this.oauth.authUrl();
  }

  googleCallback(code: string): Promise<GoogleSession> {
    return this.oauth.callback(code);
  }

  async seedAdmin(): Promise<void> {
    const count = await this.prisma.user.count();

    if (count > 0) return;

    const email = process.env.ADMIN_SEED_EMAIL;

    if (!email) return;

    await this.prisma.user.create({
      data: {
        email,
        username: "admin",
        displayName: "Admin",
        passwordHash: await hashPassword(`Admin-${Date.now()}`),
        isAdmin: true,
        isEmailVerified: true,
      },
    });
  }
}
