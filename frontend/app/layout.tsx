import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Carreras ARG",
  description: "Seguimiento de materias y correlativas para estudiantes argentinos.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
