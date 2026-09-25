import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma.service";
import { ERR } from "../../shared/api-error";
import type { GoogleAuthUrl, GoogleSession } from "./dto";
import { SessionManager } from "./session-manager";

function deriveUsername(email: string): string {
  return email
    .split("@")[0]
    .replace(/[^a-z0-9_]/gi, "_")
    .slice(0, 20);
}

@Injectable()
export class GoogleOAuth {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sessions: SessionManager,
  ) {}

  authUrl(): GoogleAuthUrl {
    const params = new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID ?? "",
      redirect_uri: `${process.env.NEXT_PUBLIC_API_URL ?? ""}/api/auth/google/callback`,
      response_type: "code",
      scope: "openid email profile",
    });

    return { url: `https://accounts.google.com/o/oauth2/v2/auth?${params}` };
  }

  async callback(code: string): Promise<GoogleSession> {
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

    // ponytail: id_token sin verificar firma, solo decodificado. Verificar con jose/google-auth-library si el login Google sale de MVP.
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
      const base = deriveUsername(email!);

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

    const session = await this.sessions.create(user.id);

    return { ...session, userId: user.id };
  }
}
