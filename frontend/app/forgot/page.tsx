import ForgotForm from "@/features/auth/forgot-form";
import Card from "@/components/card";
import { Container } from "@/components/container";

export const metadata = {
  title: "Recuperar contraseña",
  description: "Pedí un link para restablecer tu contraseña de Carreras ARG.",
  robots: { index: false },
};

export default function ForgotPage() {
  return (
    <main>
      <Container className="max-w-narrow py-12">
        <div className="mb-6 text-center">
          <h1 className="text-xl font-semibold tracking-tight">Recuperar contraseña</h1>
        </div>
        <Card>
          <ForgotForm />
        </Card>
      </Container>
    </main>
  );
}
