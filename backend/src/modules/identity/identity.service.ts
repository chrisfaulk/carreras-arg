import { Injectable } from "@nestjs/common";
import { uuidv7 } from "uuidv7";
import { z } from "zod";
import type { CookieOptions } from "express";
import { PrismaService } from "../../prisma.service";
import { ERR, IdResult, OkResult } from "../../shared/api-error";
import { sendMail } from "../../shared/mail";
import { checkToken, signToken, tokenIat } from "../../shared/tokens";
import { comparePassword, hashOpaque, hashPassword, opaqueToken } from "./guards";

export const registerSchema = z.object({
  email: z.string().email(),
  username: z
    .string()
    .min(3)
    .max(30)
    .regex(/^[a-z0-9_]+$/i),
  displayName: z.string().min(1).max(80),
  password: z.string().min(8),
  acceptedPrivacy: z.literal(true),
});

export const loginSchema = z.object({ email: z.string().email(), password: z.string().min(1) });

export const forgotSchema = z.object({ email: z.string().email() });

export const resetSchema = z.object({ token: z.string().min(1), password: z.string().min(8) });

export const setPasswordSchema = z.object({ password: z.string().min(8) });

export const updateMeSchema = z.object({
  displayName: z.string().min(1).max(80).optional(),
  isPublic: z.boolean().optional(),
});

export type RegisterInput = z.input<typeof registerSchema>;

export type RegisterData = z.infer<typeof registerSchema>;

export type LoginInput = z.input<typeof loginSchema>;

export type LoginData = z.infer<typeof loginSchema>;

export type ForgotInput = z.input<typeof forgotSchema>;

export type ForgotData = z.infer<typeof forgotSchema>;

export type ResetInput = z.input<typeof resetSchema>;

export type ResetData = z.infer<typeof resetSchema>;

export type SetPasswordInput = z.input<typeof setPasswordSchema>;

export type SetPasswordData = z.infer<typeof setPasswordSchema>;

export type UpdateMeInput = z.input<typeof updateMeSchema>;

export type UpdateMeData = z.infer<typeof updateMeSchema>;

export interface Session {
  access: string;
  refresh: string;
}

export interface GoogleSession extends Session {
  userId: string;
}

export interface GoogleAuthUrl {
  url: string;
}

const ACCESS_MS = 15 * 60 * 1000;

const REFRESH_MS = 7 * 24 * 60 * 60 * 1000;

export function cookieOpts(maxAge: number): CookieOptions {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge,
  };
}

@Injectable()
export class IdentityService {
  constructor(private readonly prisma: PrismaService) {}

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

    return this.newSession(user!.id);
  }

  private async newSession(userId: string): Promise<Session> {
    const access = signToken(userId, "access");
    const { raw, hash } = opaqueToken();

    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash: hash,
        familyId: uuidv7(),
        expiresAt: new Date(Date.now() + REFRESH_MS),
      },
    });

    return { access, refresh: raw };
  }

  async refresh(raw: string | undefined): Promise<Session> {
    if (!raw) ERR.unauth();

    const row = await this.prisma.refreshToken.findFirst({
      where: { tokenHash: hashOpaque(raw!) },
    });

    if (!row || row.expiresAt < new Date()) ERR.unauth();

    const current = row!;

    if (current.revokedAt) {
      await this.prisma.refreshToken.updateMany({
        where: { familyId: current.familyId, revokedAt: null },
        data: { revokedAt: new Date() },
      });

      ERR.unauth();
    }

    const { raw: next, hash } = opaqueToken();

    await this.prisma.$transaction([
      this.prisma.refreshToken.update({ where: { id: current.id }, data: { revokedAt: new Date() } }),
      this.prisma.refreshToken.create({
        data: {
          userId: current.userId,
          tokenHash: hash,
          familyId: current.familyId,
          expiresAt: new Date(Date.now() + REFRESH_MS),
        },
      }),
    ]);

    return { access: signToken(current.userId, "access"), refresh: next };
  }

  async logout(raw: string | undefined): Promise<OkResult> {
    if (raw) {
      const row = await this.prisma.refreshToken.findFirst({
        where: { tokenHash: hashOpaque(raw) },
      });

      if (row) {
        await this.prisma.refreshToken.updateMany({
          where: { familyId: row.familyId, revokedAt: null },
          data: { revokedAt: new Date() },
        });
      }
    }

    return { ok: true };
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

    await this.prisma.refreshToken.updateMany({
      where: { userId: sub!, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    return { ok: true };
  }

  async setPassword(userId: string, data: SetPasswordData): Promise<OkResult> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: await hashPassword(data.password) },
    });

    return { ok: true };
  }

  async updateMe(userId: string, data: UpdateMeData) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { displayName: data.displayName, isPublic: data.isPublic },
      select: { id: true, username: true, email: true, displayName: true, isPublic: true },
    });
  }

  googleUrl(): GoogleAuthUrl {
    const params = new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID ?? "",
      redirect_uri: `${process.env.NEXT_PUBLIC_API_URL ?? ""}/api/auth/google/callback`,
      response_type: "code",
      scope: "openid email profile",
    });

    return { url: `https://accounts.google.com/o/oauth2/v2/auth?${params}` };
  }

  async googleCallback(code: string): Promise<GoogleSession> {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID ?? "",
        client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
        redirect_uri: `${process.env.NEXT_PUBLIC_API_URL ?? ""}/api/auth/google/callback`,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenRes.ok) ERR.unauth();

    const tokens = (await tokenRes.json()) as { id_token?: string };
    const idToken = tokens.id_token;

    if (!idToken) ERR.unauth();

    const payload = JSON.parse(Buffer.from(idToken!.split(".")[1], "base64").toString()) as {
      sub?: string;
      email?: string;
      name?: string;
    };

    const sub = payload.sub;
    const email = payload.email;

    if (!sub || !email) ERR.unauth();

    let user = await this.prisma.user.findFirst({
      where: { OR: [{ googleSub: sub! }, { email: email! }] },
    });

    if (!user) {
      const base = email!
        .split("@")[0]
        .replace(/[^a-z0-9_]/gi, "_")
        .slice(0, 20);

      user = await this.prisma.user.create({
        data: {
          email: email!,
          username: `${base}_${Date.now().toString(36)}`,
          displayName: payload.name ?? base,
          googleSub: sub!,
          isEmailVerified: true,
        },
      });
    } else if (!user.googleSub) {
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: { googleSub: sub!, isEmailVerified: true },
      });
    }

    const session = await this.newSession(user.id);

    return { ...session, userId: user.id };
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

export { ACCESS_MS as ACCESS_DAYS, REFRESH_MS as REFRESH_DAYS };
