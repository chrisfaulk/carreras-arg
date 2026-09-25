import Link from "next/link";
import Card from "@/components/card";
import GoogleButton from "./google-button";
import LoginForm from "./login-form";
import RegisterForm from "./register-form";

const MODES = {
  login: {
    title: "Iniciar sesión",
    switchHint: "¿No tenés cuenta?",
    switchLabel: "Registrarse",
    switchHref: "/register",
  },
  register: {
    title: "Crear cuenta",
    switchHint: "¿Ya tenés cuenta?",
    switchLabel: "Iniciar sesión",
    switchHref: "/login",
  },
};

export default function AuthCard({ mode }: { mode: "login" | "register" }) {
  const copy = MODES[mode];

  return (
    <div className="grid gap-6">
      <h1 className="text-center text-xl font-semibold tracking-tight">{copy.title}</h1>

      <Card className="grid gap-6">
        {mode === "login" ? <LoginForm /> : <RegisterForm />}

        <p className="text-center text-sm text-muted">
          {copy.switchHint}{" "}
          <Link href={copy.switchHref} className="text-fg underline underline-offset-4 hover:text-primary">
            {copy.switchLabel}
          </Link>
        </p>

        <div className="flex items-center gap-4">
          <span className="h-px flex-1 bg-border" />
          <span className="text-sm text-muted">o</span>
          <span className="h-px flex-1 bg-border" />
        </div>

        <GoogleButton />
      </Card>
    </div>
  );
}
