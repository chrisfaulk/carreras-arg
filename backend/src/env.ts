import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(1),
  GOOGLE_CLIENT_ID: z.string().min(1),
  GOOGLE_CLIENT_SECRET: z.string().min(1),
  RESEND_API_KEY: z.string().min(1),
  NEXT_PUBLIC_API_URL: z.string().min(1),
  ADMIN_SEED_EMAIL: z.string().email(),
  ALLOWLIST_IPS: z.string().optional(),
  CORS_ORIGINS: z.string().min(1).default("http://localhost:3000"),
  PORT: z.coerce.number().int().positive().default(3001),
});

export const env = envSchema.parse(process.env);
