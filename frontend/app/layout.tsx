import type { Metadata } from "next";
import localFont from "next/font/local";
import { clsx as cx } from "clsx";
import CookieBanner from "@/features/cookies/cookie-banner";
import Providers from "./providers";
import Toaster from "@/components/ui/toaster";
import SiteHeader from "@/components/site-header";
import SiteFooter from "@/components/site-footer";
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
      <body className={cx("flex min-h-screen flex-col")}>
        <SiteHeader />
        <Providers>
          <div className="flex-1">{children}</div>
          <Toaster />
        </Providers>
        <CookieBanner />
        <SiteFooter />
      </body>
    </html>
  );
}
