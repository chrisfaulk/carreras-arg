"use client";

import { useState } from "react";
import { clsx as cx } from "clsx";
import Button from "@/components/ui/button";
import TextField from "@/components/ui/text-field";
import { toast } from "@/components/ui/toaster";
import { api } from "@/lib/api";
import { clearDraft, useDraftState } from "./form-draft";

export default function ForgotForm({ className }: { className?: string }) {
  const [email, setEmail] = useDraftState("forgot", "email");
  const [error, setError] = useState<string | undefined>(undefined);
  const [pending, setPending] = useState(false);

  async function send(): Promise<void> {
    if (!email.includes("@")) {
      setError("Email inválido");

      return;
    }

    setError(undefined);
    setPending(true);

    try {
      await api("/auth/forgot", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });
    } catch {
      /* sin oráculo: misma respuesta siempre */
    }

    toast("Si el email existe, enviamos un link");

    clearDraft("forgot");

    setPending(false);
  }

  return (
    <div className={cx("grid gap-4", className)}>
      <TextField
        id="email"
        label="Email"
        type="email"
        autoComplete="email"
        value={email}
        error={error}
        onChange={(e) => setEmail(e.target.value)}
      />

      <Button variant="primary" disabled={pending} onClick={() => void send()} className="w-full">
        Enviar link
      </Button>
    </div>
  );
}
