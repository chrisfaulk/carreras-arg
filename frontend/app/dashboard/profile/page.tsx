import ProfileForm from "@/features/profile/profile-form";
import EmptyState from "@/components/ui/empty-state";
import { Container, PageHeader } from "@/components/container";
import { getSession } from "@/features/session/get-session";

export const metadata = {
  title: "Mi perfil",
  description: "Editá tu nombre visible y la visibilidad de tu perfil de Carreras ARG.",
  robots: { index: false },
};

export default async function ProfilePage() {
  const me = await getSession();

  if (!me) {
    return (
      <main>
        <Container>
          <EmptyState
            title="Iniciá sesión"
            hint="Tu perfil solo es visible con sesión iniciada."
            ctaHref="/login"
            ctaLabel="Ir a iniciar sesión"
          />
        </Container>
      </main>
    );
  }

  return (
    <main>
      <Container>
        <PageHeader title="Mi perfil" sub="Tu nombre visible y la privacidad de tu avance." />
        <div className="pb-12">
          <ProfileForm initial={me} />
        </div>
      </Container>
    </main>
  );
}
