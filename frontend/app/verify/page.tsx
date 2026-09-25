import EmptyState from "@/components/ui/empty-state";
import { Container } from "@/components/container";

export const metadata = {
  title: "Verificar email",
  description: "Verificá tu email para activar tu cuenta de Carreras ARG.",
  robots: { index: false },
};

async function verify(token: string): Promise<boolean> {
  const api = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

  try {
    const res = await fetch(`${api}/api/auth/verify?token=${encodeURIComponent(token)}`, {
      cache: "no-store",
    });

    return res.ok;
  } catch {
    return false;
  }
}

export default async function VerifyPage({ searchParams }: { searchParams: { token?: string } }) {
  if (!searchParams.token) {
    return (
      <main>
        <Container>
          <EmptyState
            title="Falta el token"
            hint="El link de verificación no trae token."
            ctaHref="/register"
            ctaLabel="Volver a Registrarse"
          />
        </Container>
      </main>
    );
  }

  if (!(await verify(searchParams.token))) {
    return (
      <main>
        <Container>
          <EmptyState
            title="Token inválido"
            hint="El link venció o ya fue usado."
            ctaHref="/login"
            ctaLabel="Ir a iniciar sesión"
          />
        </Container>
      </main>
    );
  }

  return (
    <main>
      <Container>
        <EmptyState
          title="Cuenta verificada"
          hint="Ya podés iniciar sesión."
          ctaHref="/login"
          ctaLabel="Ir a iniciar sesión"
        />
      </Container>
    </main>
  );
}
