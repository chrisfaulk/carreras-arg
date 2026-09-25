import { Resend } from "resend";
import { env } from "../env";

function footer(): string {
  return `\n\n—\nCarreras ARG · Ver privacidad: /legal/privacy y cookies: /legal/cookies`;
}

export async function sendMail(to: string, subject: string, text: string): Promise<void> {
  const body = `${text}${footer()}`;

  // sin Resend en dev/CI se loguea, no se envía
  if (!process.env.RESEND_API_KEY) {
    console.log(`[mail:stub] to=${to} subject=${subject} ${body.slice(0, 200)}`);

    return;
  }

  const resend = new Resend(env.RESEND_API_KEY);

  try {
    await resend.emails.send({ from: "Carreras ARG <no-reply@carreras-arg.ar>", to, subject, text: body });
  } catch {
    console.log(`[mail:stub] to=${to} subject=${subject} ${body.slice(0, 200)}`);
  }
}
