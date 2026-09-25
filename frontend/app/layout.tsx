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
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://carreras-arg.ar"),
  title: { default: "Carreras ARG", template: "%s - Carreras ARG" },
  description:
    "Seguimiento de materias, correlativas, promedios y avance para estudiantes de universidades argentinas.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Carreras ARG",
    description: "Seguimiento de materias, correlativas, promedios y avance para estudiantes argentinos.",
    images: [{ url: "/og.svg" }],
  },
  twitter: { card: "summary", title: "Carreras ARG" },
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
