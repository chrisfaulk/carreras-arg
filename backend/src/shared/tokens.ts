import jwt from "jsonwebtoken";
import { z } from "zod";
import { env } from "../env";

const payloadSchema = z.object({
  sub: z.string().min(1),
  purpose: z.enum(["access", "verify", "reset"]),
  jti: z.string().optional(),
  iat: z.number().optional(),
});

const EXPIRES = { access: "15m", verify: "24h", reset: "1h" } as const;

export function signToken(sub: string, purpose: "access" | "verify" | "reset"): string {
  return jwt.sign({ sub, purpose }, env.JWT_SECRET, { expiresIn: EXPIRES[purpose] });
}

export function checkToken(token: string, purpose: "access" | "verify" | "reset"): string {
  try {
    const parsed = payloadSchema.parse(jwt.verify(token, env.JWT_SECRET));

    if (parsed.purpose !== purpose) throw new Error("purpose");

    return parsed.sub;
  } catch {
    throw new Error(`invalid_${purpose}_token`);
  }
}

export function tokenIat(token: string): number {
  const decoded = jwt.decode(token) as { iat?: number } | null;

  return decoded?.iat ?? 0;
}
