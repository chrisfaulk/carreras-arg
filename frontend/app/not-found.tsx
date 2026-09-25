import Button from "@/components/ui/button";
import { Container } from "@/components/container";

export const metadata = {
  title: "No encontrada - Carreras ARG",
  description: "La página que buscás no existe. Volvé al inicio de Carreras ARG.",
};

export default function NotFound() {
  return (
    <main>
      <Container className="max-w-prose py-16 text-center">
        <p className="tnum text-sm text-muted">404</p>
        <h1 className="mt-2 text-xl font-semibold tracking-tight">Página no encontrada</h1>
        <p className="mt-2 text-md text-muted">La ruta que buscás no existe o fue movida.</p>
        <p className="mt-6">
          <Button variant="secondary" size="sm" href="/">
            Volver al inicio
          </Button>
        </p>
      </Container>
    </main>
  );
}
