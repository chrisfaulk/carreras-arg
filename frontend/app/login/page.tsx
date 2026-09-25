import LoginForm from "@/features/auth/login-form";
import Card from "@/components/card";
import { Container } from "@/components/container";

export const metadata = {
  title: "Iniciar sesión",
  description: "Iniciá sesión en Carreras ARG para ver tu panel de materias.",
  robots: { index: false },
};

export default function LoginPage() {
  return (
    <main>
      <Container className="max-w-narrow py-12">
        <div className="mb-6 text-center">
          <h1 className="text-xl font-semibold tracking-tight">Iniciar sesión</h1>
          <p className="mt-1 text-md text-muted">Seguí tus materias donde las dejaste.</p>
        </div>
        <Card>
          <LoginForm />
        </Card>
      </Container>
    </main>
  );
}
