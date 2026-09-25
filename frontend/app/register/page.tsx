import AuthCard from "@/features/auth/auth-card";
import { Container } from "@/components/container";

export const metadata = {
  title: "Registrarse",
  description: "Creá tu cuenta de Carreras ARG para seguir tus materias y correlativas.",
  robots: { index: false },
};

export default function RegisterPage() {
  return (
    <main>
      <Container className="max-w-narrow py-12">
        <AuthCard mode="register" />
      </Container>
    </main>
  );
}
