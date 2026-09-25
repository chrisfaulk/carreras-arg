import { cookies } from "next/headers";

export interface Session {
  id: string;
  username: string;
  email: string;
  displayName: string;
  isPublic: boolean;
}

export async function getSession(): Promise<Session | null> {
  const api = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

  try {
    const res = await fetch(`${api}/api/users/me`, {
      headers: { cookie: cookies().toString() },
      cache: "no-store",
    });

    if (!res.ok) return null;

    return (await res.json()) as Session;
  } catch {
    return null;
  }
}
