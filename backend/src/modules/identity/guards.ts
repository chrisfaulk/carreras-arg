import bcrypt from "bcryptjs";
import { randomBytes, createHash } from "node:crypto";
import { CanActivate, ExecutionContext, Injectable, SetMetadata } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { PrismaService } from "../../prisma.service";
import { ERR } from "../../shared/api-error";
import { checkToken } from "../../shared/tokens";

export const IS_PUBLIC = "isPublic";

export const Public = (): MethodDecorator & ClassDecorator => SetMetadata(IS_PUBLIC, true);

async function currentUser(req: { cookies?: Record<string, string> }): Promise<{ id: string; isAdmin: boolean }> {
  const token = req.cookies?.access;

  if (!token) ERR.unauth();
  let sub: string;

  try {
    sub = checkToken(token as string, "access");
  } catch {
    ERR.unauth();
  }

  return { id: sub!, isAdmin: false };
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly prisma: PrismaService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, [ctx.getHandler(), ctx.getClass()]);

    if (isPublic) return true;
    const req = ctx.switchToHttp().getRequest();
    const { id } = await currentUser(req);

    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true, isAdmin: true, deletedAt: true },
    });

    if (!user || user.deletedAt) ERR.unauth();

    req.user = { id: user!.id, isAdmin: user!.isAdmin };

    return true;
  }
}

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest();

    if (!req.user) ERR.unauth();

    if (!req.user.isAdmin) ERR.forbidden();

    return true;
  }
}

export function hashPassword(pw: string): Promise<string> {
  return bcrypt.hash(pw, 12);
}

export function comparePassword(pw: string, hash: string): Promise<boolean> {
  return bcrypt.compare(pw, hash);
}

export interface OpaqueToken {
  raw: string;
  hash: string;
}

export function opaqueToken(): OpaqueToken {
  const raw = randomBytes(32).toString("hex");

  return { raw, hash: createHash("sha256").update(raw).digest("hex") };
}

export function hashOpaque(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}
