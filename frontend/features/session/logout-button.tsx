"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { clsx as cx } from "clsx";
import { toast } from "@/components/ui/toaster";

export default function LogoutButton({ className }: { className?: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function logout(): Promise<void> {
    setPending(true);

    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });

      router.push("/");
      router.refresh();
    } catch {
      toast("No se pudo cerrar sesión, reintentá");

      setPending(false);
    }
  }

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => void logout()}
      className={cx(
        "rounded-full px-3 py-1.5 text-sm text-muted transition-colors hover:text-primary disabled:opacity-50",
        className,
      )}
    >
      Salir
    </button>
  );
}
