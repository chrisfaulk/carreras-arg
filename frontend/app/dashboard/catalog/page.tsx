import EmptyState from "@/components/ui/empty-state";
import { Container, PageHeader } from "@/components/container";
import CatalogBrowser, { catalogParams } from "@/features/catalog/catalog-browser";
import { getSession } from "@/features/session/get-session";

export const metadata = {
  title: "Catálogo",
  description: "Explorá carreras y planes para registrar el plan que cursás.",
  robots: { index: false },
};

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: { universityId?: string; page?: string };
}) {
  const me = await getSession();

  if (!me) {
    return (
      <main>
        <Container>
          <EmptyState
            title="Iniciá sesión"
            hint="El catálogo privado solo es visible con sesión iniciada."
            ctaHref="/login"
            ctaLabel="Ir a iniciar sesión"
          />
        </Container>
      </main>
    );
  }

  const { universityId, page } = catalogParams(searchParams);

  return (
    <main>
      <Container>
        <PageHeader title="Catálogo" sub="Elegí tu carrera y registrá el plan que cursás." />
        <div className="pb-12">
          <CatalogBrowser universityId={universityId} page={page} base="/dashboard/catalog" />
        </div>
      </Container>
    </main>
  );
}
