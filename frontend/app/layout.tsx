import type { Metadata } from "next";
import localFont from "next/font/local";
import Link from "next/link";
import "./globals.css";

const inter = localFont({
  src: [
    { path: "../public/fonts/inter-latin-400.woff2", weight: "400" },
    { path: "../public/fonts/inter-latin-600.woff2", weight: "600" },
  ],
});

export const metadata: Metadata = {
  title: "Carreras ARG",
  description: "Seguimiento de materias y correlativas para estudiantes argentinos.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={inter.className}>
      <body>
        {children}
        <footer className="p-4 text-sm text-muted">
          <Link href="/legal/privacy">Privacidad</Link>
          {" · "}
          <Link href="/legal/terms">Términos</Link>
          {" · "}
          <Link href="/legal/cookies">Cookies</Link>
        </footer>
      </body>
    </html>
  );
}
