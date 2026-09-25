import type { CookieOptions } from "express";

export const ACCESS_MAX_AGE_MS = 15 * 60 * 1000;

export const REFRESH_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export function cookieOpts(maxAge: number): CookieOptions {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge,
  };
}
