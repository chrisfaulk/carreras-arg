import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container, PageHeader } from "@/components/container";
import { renderLegalDoc } from "@/lib/legal";

const SLUGS = ["privacy", "terms", "cookies"] as const;

type LegalSlug = (typeof SLUGS)[number];

const META: Record<LegalSlug, { title: string; description: string }> = {
  privacy: {
    title: "Política de privacidad",
    description: "Cómo Carreras ARG trata tus datos según la Ley 25.326: datos mínimos, derechos ARCO y borrado.",
  },
  terms: {
    title: "Términos y condiciones",
    description: "Condiciones de uso de Carreras ARG: cuentas, uso aceptable, catálogo y propiedad intelectual.",
  },
  cookies: {
    title: "Política de cookies",
    description: "Carreras ARG solo usa cookies necesarias de sesión. Sin analytics ni tracking de terceros.",
  },
};

export function generateStaticParams(): { slug: string }[] {
  return SLUGS.map((slug) => ({ slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const meta =
    params.slug === "privacy" || params.slug === "terms" || params.slug === "cookies"
      ? META[params.slug]
      : { title: "Legal", description: "Documentos legales de Carreras ARG." };

  return {
    title: meta.title,
    description: meta.description,
    alternates: { canonical: `/legal/${params.slug}` },
    openGraph: { title: meta.title, description: meta.description },
  };
}

function titleFor(slug: string): string {
  if (slug === "privacy") {
    return "Política de privacidad";
  }

  if (slug === "terms") {
    return "Términos y condiciones";
  }

  return "Política de cookies";
}

export default async function LegalPage({ params }: { params: { slug: string } }) {
  if (!(SLUGS as readonly string[]).includes(params.slug)) {
    notFound();
  }

  const html = await renderLegalDoc(params.slug);

  return (
    <main>
      <Container className="max-w-prose">
        <PageHeader title={titleFor(params.slug)} />
        <article className="prose-legal pb-4 text-md leading-7" dangerouslySetInnerHTML={{ __html: html }} />
        <p className="pb-12">
          <Link className="text-sm text-muted underline-offset-4 hover:text-primary hover:underline" href="/">
            Volver al inicio
          </Link>
        </p>
      </Container>
    </main>
  );
}
