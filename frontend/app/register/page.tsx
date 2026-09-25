import RegisterForm from "@/features/auth/register-form";
import Card from "@/components/card";
import { Container } from "@/components/container";

export const metadata = {
  title: "Crear cuenta",
  description: "Creá tu cuenta de Carreras ARG para seguir tus materias y correlativas.",
  robots: { index: false },
};

export default function RegisterPage() {
  return (
    <main>
      <Container className="max-w-narrow py-12">
        <div className="mb-6 text-center">
          <h1 className="text-xl font-semibold tracking-tight">Crear cuenta</h1>
          <p className="mt-1 text-md text-muted">Un email, un plan, todas tus materias.</p>
        </div>
        <Card>
          <RegisterForm />
        </Card>
      </Container>
    </main>
  );
}
