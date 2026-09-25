"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { clsx as cx } from "clsx";
import Button from "@/components/ui/button";
import CheckboxField from "@/components/ui/checkbox-field";
import TextField from "@/components/ui/text-field";
import { toast } from "@/components/ui/toaster";
import { api } from "@/lib/api";
import { clearDraft, useDraftState } from "./form-draft";

export default function RegisterForm({ className }: { className?: string }) {
  const router = useRouter();
  const [email, setEmail] = useDraftState("register", "email");
  const [username, setUsername] = useDraftState("register", "username");
  const [displayName, setDisplayName] = useDraftState("register", "displayName");
  const [password, setPassword] = useDraftState("register", "password");
  const [privacy, setPrivacy] = useDraftState("register", "acceptedPrivacy");
  const acceptedPrivacy = privacy === "1";
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);

  async function register(): Promise<void> {
    const next: Record<string, string> = {};

    if (!email.includes("@")) next.email = "Email inválido";

    if (username.length < 3) next.username = "Mínimo 3 caracteres";

    if (displayName.length < 1) next.displayName = "Requerido";

    if (password.length < 8) next.password = "Mínimo 8 caracteres";

    if (!acceptedPrivacy) next.acceptedPrivacy = "Tenés que aceptar la política";

    setErrors(next);

    if (Object.keys(next).length > 0) return;

    setPending(true);

    try {
      await api("/auth/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, username, displayName, password, acceptedPrivacy: true }),
      });

      toast("Cuenta creada, revisá tu email");

      clearDraft("register");

      router.push("/login");
    } catch {
      toast("No se pudo crear la cuenta, reintentá");

      setPending(false);
    }
  }

  return (
    <div className={cx("grid gap-4", className)}>
      <TextField
        id="email"
        label="Email"
        type="email"
        autoComplete="email"
        value={email}
        error={errors.email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <TextField
        id="username"
        label="Usuario"
        autoComplete="username"
        value={username}
        minLength={3}
        maxLength={30}
        error={errors.username}
        onChange={(e) => setUsername(e.target.value)}
      />

      <TextField
        id="displayName"
        label="Nombre visible"
        autoComplete="nickname"
        value={displayName}
        maxLength={80}
        error={errors.displayName}
        onChange={(e) => setDisplayName(e.target.value)}
      />

      <TextField
        id="password"
        label="Contraseña"
        type="password"
        autoComplete="new-password"
        value={password}
        minLength={8}
        error={errors.password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <CheckboxField
        id="acceptedPrivacy"
        label="Acepto la política de privacidad y los términos"
        checked={acceptedPrivacy}
        onChange={(e) => setPrivacy(e.target.checked ? "1" : "")}
        error={errors.acceptedPrivacy}
        hint={
          <span>
            Ver{" "}
            <Link className="underline underline-offset-4" href="/legal/privacy">
              privacidad
            </Link>{" "}
            y{" "}
            <Link className="underline underline-offset-4" href="/legal/terms">
              términos
            </Link>
            .
          </span>
        }
      />

      <Button variant="primary" disabled={pending} onClick={() => void register()} className="w-full">
        Crear cuenta
      </Button>
    </div>
  );
}
