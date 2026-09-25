"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { clsx as cx } from "clsx";
import Button from "@/components/ui/button";
import TextField from "@/components/ui/text-field";
import { toast } from "@/components/ui/toaster";
import { api } from "@/lib/api";

export default function LoginForm({ className }: { className?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);

  async function login(): Promise<void> {
    const next: Record<string, string> = {};

    if (!email.includes("@")) next.email = "Email inválido";

    if (password.length < 1) next.password = "Requerida";

    setErrors(next);

    if (Object.keys(next).length > 0) return;

    setPending(true);

    try {
      await api("/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      router.push("/dashboard/profile");
      router.refresh();
    } catch {
      toast("Email o contraseña inválidos");

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
        id="password"
        label="Contraseña"
        type="password"
        autoComplete="current-password"
        value={password}
        error={errors.password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <Button variant="primary" disabled={pending} onClick={() => void login()} className="w-full">
        Iniciar sesión
      </Button>

      <p className="text-center text-sm text-muted">
        <Link href="/forgot" className="underline-offset-4 hover:text-primary hover:underline">
          Olvidé mi contraseña
        </Link>
      </p>
    </div>
  );
}
