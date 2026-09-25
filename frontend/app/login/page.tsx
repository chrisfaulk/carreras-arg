import AuthCard from "@/features/auth/auth-card";
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
        <AuthCard mode="login" />
      </Container>
    </main>
  );
}
