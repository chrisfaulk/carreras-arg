import { z } from "zod";

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

export const loginSchema = z.object({ email: z.string().email(), password: z.string().min(1) });

export const forgotSchema = z.object({ email: z.string().email() });

export const resetSchema = z.object({ token: z.string().min(1), password: z.string().min(8) });

export const setPasswordSchema = z.object({ password: z.string().min(8) });

export const updateMeSchema = z.object({
  displayName: z.string().min(1).max(80).optional(),
  isPublic: z.boolean().optional(),
});

export type RegisterInput = z.input<typeof registerSchema>;

export type RegisterData = z.infer<typeof registerSchema>;

export type LoginInput = z.input<typeof loginSchema>;

export type LoginData = z.infer<typeof loginSchema>;

export type ForgotInput = z.input<typeof forgotSchema>;

export type ForgotData = z.infer<typeof forgotSchema>;

export type ResetInput = z.input<typeof resetSchema>;

export type ResetData = z.infer<typeof resetSchema>;

export type SetPasswordInput = z.input<typeof setPasswordSchema>;

export type SetPasswordData = z.infer<typeof setPasswordSchema>;

export type UpdateMeInput = z.input<typeof updateMeSchema>;

export type UpdateMeData = z.infer<typeof updateMeSchema>;

export interface Session {
  access: string;
  refresh: string;
}

export interface GoogleSession extends Session {
  userId: string;
}

export interface GoogleAuthUrl {
  url: string;
}
