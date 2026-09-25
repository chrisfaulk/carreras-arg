// ponytail: espejo manual de backend registerSchema sin sumar zod al frontend.
// Si el schema backend cambia, actualizar estos umbrales a la par.
export const REGISTER_RULES = {
  usernameMin: 3,
  usernameMax: 30,
  displayNameMax: 80,
  passwordMin: 8,
} as const;

export interface RegisterFields {
  email: string;
  username: string;
  displayName: string;
  password: string;
  acceptedPrivacy: boolean;
}

export interface RegisterErrors {
  email?: string;
  username?: string;
  displayName?: string;
  password?: string;
  acceptedPrivacy?: string;
}

export function validateRegister(fields: RegisterFields): RegisterErrors {
  const next: RegisterErrors = {};

  if (!fields.email.includes("@")) next.email = "Email inválido";

  if (fields.username.length < REGISTER_RULES.usernameMin)
    next.username = `Mínimo ${REGISTER_RULES.usernameMin} caracteres`;

  if (fields.displayName.length < 1) next.displayName = "Requerido";

  if (fields.password.length < REGISTER_RULES.passwordMin)
    next.password = `Mínimo ${REGISTER_RULES.passwordMin} caracteres`;

  if (!fields.acceptedPrivacy) next.acceptedPrivacy = "Tenés que aceptar la política";

  return next;
}
