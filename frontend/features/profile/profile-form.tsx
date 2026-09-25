"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { clsx as cx } from "clsx";
import { api } from "@/lib/api";
import { toast } from "@/components/ui/toaster";
import Button from "@/components/ui/button";
import CheckboxField from "@/components/ui/checkbox-field";
import TextField from "@/components/ui/text-field";

interface Me {
  id: string;
  username: string;
  email: string;
  displayName: string;
  isPublic: boolean;
}

interface MeUpdate {
  displayName?: string;
  isPublic?: boolean;
}

async function getMe(): Promise<Me> {
  return api<Me>("/users/me");
}

async function putMe(data: MeUpdate): Promise<Me> {
  return api<Me>("/users/me", {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(data),
  });
}

export default function ProfileForm({ initial, className }: { initial: Me; className?: string }) {
  const query = useQueryClient();
  const me = useQuery({ queryKey: ["me"], queryFn: getMe, initialData: initial });
  const [displayName, setDisplayName] = useState(initial.displayName);
  const [isPublic, setIsPublic] = useState(initial.isPublic);

  const mutation = useMutation({
    mutationFn: putMe,

    onMutate: async (next) => {
      await query.cancelQueries({ queryKey: ["me"] });

      const prev = query.getQueryData<Me>(["me"]);

      query.setQueryData<Me>(["me"], (old) => ({ ...old!, ...next }));

      return { prev };
    },

    onError: (_error, _next, context) => {
      if (context?.prev) query.setQueryData(["me"], context.prev);

      toast("No se pudo guardar, reintentá");
    },

    onSuccess: () => {
      toast("Cambios guardados");
    },

    onSettled: () => {
      void query.invalidateQueries({ queryKey: ["me"] });
    },
  });

  function save(): void {
    mutation.mutate({ displayName, isPublic });
  }

  return (
    <div className={cx("grid max-w-prose gap-6", className)}>
      <p className="tnum text-sm text-muted">
        {me.data.username} · {me.data.email}
      </p>

      <TextField
        id="displayName"
        label="Nombre visible"
        value={displayName}
        minLength={1}
        maxLength={80}
        error={mutation.isError ? "No se pudo guardar, reintentá" : undefined}
        onChange={(e) => setDisplayName(e.target.value)}
      />

      <CheckboxField
        id="isPublic"
        label="Perfil público"
        checked={isPublic}
        onChange={(e) => setIsPublic(e.target.checked)}
        hint={<span>Si está activo, tu avance es visible con tu nombre.</span>}
      />

      <p>
        <Button variant="primary" disabled={mutation.isPending} onClick={save}>
          Guardar cambios
        </Button>
      </p>
    </div>
  );
}
