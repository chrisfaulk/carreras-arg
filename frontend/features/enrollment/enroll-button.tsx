"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Button from "@/components/ui/button";
import { toast } from "@/components/ui/toaster";
import { ApiError, api } from "@/lib/api";

export default function EnrollButton({ planId, className }: { planId: string; className?: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function enroll(): Promise<void> {
    setPending(true);

    try {
      await api("/enrollments", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ studyPlanId: planId }),
      });

      toast("Te anotaste al plan");

      router.refresh();
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        router.push("/login");

        return;
      }

      if (error instanceof ApiError && error.status === 409) {
        toast("Ya estás anotado a este plan");

        router.refresh();

        return;
      }

      toast("No se pudo completar, reintentá");

      setPending(false);
    }
  }

  return (
    <Button variant="primary" size="sm" disabled={pending} onClick={() => void enroll()} className={className}>
      Anotarme a este plan
    </Button>
  );
}
