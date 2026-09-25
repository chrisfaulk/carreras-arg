import Link from "next/link";
import { clsx as cx } from "clsx";
import Button from "./ui/button";
import { Container } from "./container";
import { getSession } from "@/features/session/get-session";
import LogoutButton from "@/features/session/logout-button";
import { getTheme } from "@/features/theme/theme";
import ThemeToggle from "@/features/theme/theme-toggle";

export default async function SiteHeader({ className }: { className?: string }) {
  const session = await getSession();
  const theme = await getTheme();

  return (
    <header className={cx("sticky top-0 z-40 border-b border-border bg-bg backdrop-blur", className)}>
      <Container>
        <nav aria-label="Principal" className="flex h-14 items-center justify-between gap-4">
          <p className="flex items-center gap-6">
            <Link href="/" className="text-md font-semibold tracking-tight">
              Carreras ARG
            </Link>
            {session ? (
              <Link href="/dashboard/profile" className="hidden text-sm text-muted hover:text-primary sm:inline">
                Mi panel
              </Link>
            ) : null}
          </p>
          <p className="flex items-center gap-2">
            <ThemeToggle initial={theme ?? "system"} />
            {session ? (
              <LogoutButton />
            ) : (
              <Button variant="primary" size="sm" href="/login">
                Ingresar
              </Button>
            )}
          </p>
        </nav>
      </Container>
    </header>
  );
}
