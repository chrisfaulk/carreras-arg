import Skeleton from "@/components/ui/skeleton";
import { Container } from "@/components/container";

export default function Loading() {
  return (
    <main aria-busy="true">
      <Container className="grid gap-6 py-8">
        <div className="grid gap-2">
          <h1 className="text-xl font-semibold tracking-tight">Plan de estudio</h1>
          <div className="shimmer h-4 w-1/2 rounded-md bg-border" aria-hidden="true" />
        </div>
        <Skeleton label="Cargando plan" lines={8} />
      </Container>
    </main>
  );
}
