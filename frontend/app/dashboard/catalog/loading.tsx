import Skeleton from "@/components/ui/skeleton";
import { Container } from "@/components/container";

export default function Loading() {
  return (
    <main aria-busy="true">
      <Container className="grid gap-6 py-8">
        <h1 className="text-xl font-semibold tracking-tight">Catálogo</h1>
        <Skeleton label="Cargando catálogo" lines={6} />
      </Container>
    </main>
  );
}
