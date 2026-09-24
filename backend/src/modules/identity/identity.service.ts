import { Injectable } from "@nestjs/common";
import { z } from "zod";
import { PrismaService } from "../../prisma.service";
import { ERR, IdResult, OkResult } from "../../shared/api-error";
import { sendMail } from "../../shared/mail";
import { checkToken, signToken } from "../../shared/tokens";
import { hashPassword } from "./guards";

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

export type RegisterInput = z.input<typeof registerSchema>;

export type RegisterData = z.infer<typeof registerSchema>;

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
}
