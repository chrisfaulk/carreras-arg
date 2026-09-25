import Skeleton from "@/components/ui/skeleton";
import { Container } from "@/components/container";

export default function Loading() {
  return (
    <main aria-busy="true">
      <Container className="grid gap-6 py-8">
        <div className="grid gap-2">
          <h1 className="text-xl font-semibold tracking-tight">Universidades</h1>
          <div className="shimmer h-4 w-2/3 rounded-md bg-border" aria-hidden="true" />
        </div>
        <Skeleton label="Cargando universidades" lines={6} />
      </Container>
    </main>
  );
}
