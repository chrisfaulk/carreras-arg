import Link from "next/link";
import { clsx as cx } from "clsx";
import { Container } from "./container";

export default function SiteFooter({ className }: { className?: string }) {
  return (
    <footer className={cx("mt-16 border-t border-border", className)}>
      <Container className="flex flex-col gap-2 py-6 text-sm text-muted md:flex-row md:items-center md:justify-between">
        <p> Carreras ARG · Seguimiento de materias y correlativas</p>
        <nav aria-label="Legal" className="flex gap-4">
          <Link className="underline-offset-4 hover:text-fg hover:underline" href="/legal/privacy">
            Privacidad
          </Link>
          <Link className="underline-offset-4 hover:text-fg hover:underline" href="/legal/terms">
            Términos
          </Link>
          <Link className="underline-offset-4 hover:text-fg hover:underline" href="/legal/cookies">
            Cookies
          </Link>
        </nav>
      </Container>
    </footer>
  );
}
