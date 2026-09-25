"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { clsx as cx } from "clsx";
import Button from "@/components/ui/button";
import TextField from "@/components/ui/text-field";
import { toast } from "@/components/ui/toaster";
import { api } from "@/lib/api";

export default function ResetForm({ className }: { className?: string }) {
  const router = useRouter();
  const token = useSearchParams().get("token");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | undefined>(undefined);
  const [pending, setPending] = useState(false);

  async function reset(): Promise<void> {
    if (password.length < 8) {
      setError("Mínimo 8 caracteres");

      return;
    }

    setError(undefined);
    setPending(true);

    try {
      await api("/auth/reset", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      toast("Contraseña actualizada");

      router.push("/login");
    } catch {
      toast("El link venció o es inválido");

      setPending(false);
    }
  }

  if (!token) {
    return <p className={cx("text-sm text-muted", className)}>Falta el token del link.</p>;
  }

  return (
    <div className={cx("grid gap-4", className)}>
      <TextField
        id="password"
        label="Nueva contraseña"
        type="password"
        autoComplete="new-password"
        value={password}
        minLength={8}
        error={error}
        onChange={(e) => setPassword(e.target.value)}
      />

      <Button variant="primary" disabled={pending} onClick={() => void reset()} className="w-full">
        Cambiar contraseña
      </Button>
    </div>
  );
}
