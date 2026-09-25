"use server";

import { cookies } from "next/headers";

const KEY = "theme";

export type Theme = "light" | "dark";

export async function getTheme(): Promise<Theme | null> {
  const value = cookies().get(KEY)?.value;

  return value === "light" || value === "dark" ? value : null;
}
