import { Container, PageHeader } from "@/components/container";
import CatalogBrowser, { catalogParams } from "@/features/catalog/catalog-browser";

export default async function Home({ searchParams }: { searchParams: { universityId?: string; page?: string } }) {
  const { universityId, page } = catalogParams(searchParams);

  return (
    <main>
      <Container>
        <PageHeader
          title="Seguí tu carrera, materia por materia"
          sub="Verificá que tu carrera esté en el catálogo, registrá el plan que cursás y descubrí qué materias podés cursar según correlativas."
        />

        <section aria-labelledby="catalogo" className="pb-12">
          <h2 id="catalogo" className="mb-2 text-md font-semibold tracking-tight">
            Catálogo de carreras
          </h2>
          <CatalogBrowser universityId={universityId} page={page} base="/" />
        </section>
      </Container>
    </main>
  );
}
