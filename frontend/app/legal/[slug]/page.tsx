import Link from "next/link";
import { notFound } from "next/navigation";
import { readLegalDoc } from "@/lib/legal";

const SLUGS = ["privacy", "terms", "cookies"];

export function generateStaticParams(): { slug: string }[] {
  return SLUGS.map((slug) => ({ slug }));
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
  if (!SLUGS.includes(params.slug)) {
    notFound();
  }

  const doc = await readLegalDoc(params.slug);

  return (
    <main className="p-8">
      <h1 className="text-lg">{titleFor(params.slug)}</h1>
      <article className="whitespace-pre-wrap text-sm">{doc}</article>
      <Link className="text-sm text-muted" href="/">
        Volver al inicio
      </Link>
    </main>
  );
}
