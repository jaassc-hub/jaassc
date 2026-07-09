import "./globals.css";

export const metadata = {
  title: process.env.NEXT_PUBLIC_JUNTA_NOMBRE || "Junta de Agua",
  description: "Sistema de control de pagos de la Junta de Agua",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
