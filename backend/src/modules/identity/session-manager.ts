import { Injectable } from "@nestjs/common";
import { uuidv7 } from "uuidv7";
import { PrismaService } from "../../prisma.service";
import { ERR, OkResult } from "../../shared/api-error";
import { signToken } from "../../shared/tokens";
import { hashOpaque, opaqueToken } from "./guards";
import { REFRESH_MAX_AGE_MS } from "./cookies";
import type { Session } from "./dto";

@Injectable()
export class SessionManager {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string): Promise<Session> {
    const access = signToken(userId, "access");
    const { raw, hash } = opaqueToken();

    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash: hash,
        familyId: uuidv7(),
        expiresAt: new Date(Date.now() + REFRESH_MAX_AGE_MS),
      },
    });

    return { access, refresh: raw };
  }

  async rotate(raw: string | undefined): Promise<Session> {
    if (!raw) ERR.unauth();

    const row = await this.prisma.refreshToken.findFirst({
      where: { tokenHash: hashOpaque(raw!) },
    });

    if (!row || row.expiresAt < new Date()) ERR.unauth();

    const current = row!;

    if (current.revokedAt) {
      await this.revokeFamily(current.familyId);

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
          expiresAt: new Date(Date.now() + REFRESH_MAX_AGE_MS),
        },
      }),
    ]);

    return { access: signToken(current.userId, "access"), refresh: next };
  }

  async revokeFamily(familyId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { familyId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async logout(raw: string | undefined): Promise<OkResult> {
    if (!raw) return { ok: true };

    const row = await this.prisma.refreshToken.findFirst({
      where: { tokenHash: hashOpaque(raw) },
    });

    if (row) await this.revokeFamily(row.familyId);

    return { ok: true };
  }

  async revokeAll(userId: string, now: Date = new Date()): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: now },
    });
  }
}
