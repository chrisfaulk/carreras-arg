"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

const KEY = "theme";

export type Theme = "light" | "dark";

export async function getTheme(): Promise<Theme | null> {
  const value = cookies().get(KEY)?.value;

  return value === "light" || value === "dark" ? value : null;
}

export async function setTheme(next: Theme): Promise<void> {
  if (next !== "light" && next !== "dark") throw new Error("theme inválido");

  cookies().set(KEY, next, {
    path: "/",
    maxAge: 31536000,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  revalidatePath("/", "layout");
}
