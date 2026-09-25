import { Suspense } from "react";
import ResetForm from "@/features/auth/reset-form";
import Skeleton from "@/components/ui/skeleton";
import Card from "@/components/card";
import { Container } from "@/components/container";

export const metadata = {
  title: "Nueva contraseña",
  description: "Definí una nueva contraseña para tu cuenta de Carreras ARG.",
  robots: { index: false },
};

export default function ResetPage() {
  return (
    <main>
      <Container className="max-w-narrow py-12">
        <div className="mb-6 text-center">
          <h1 className="text-xl font-semibold tracking-tight">Nueva contraseña</h1>
          <p className="mt-1 text-md text-muted">Elegí una clave de 8 o más caracteres.</p>
        </div>
        <Card>
          <Suspense fallback={<Skeleton label="Cargando formulario" />}>
            <ResetForm />
          </Suspense>
        </Card>
      </Container>
    </main>
  );
}
