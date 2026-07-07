import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider } from "@/lib/auth-context";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";

export const metadata: Metadata = {
  title: "LecturaMetrica",
  description: "Tu plataforma de seguimiento literario",
  // No se declara `manifest` a mano: al existir app/manifest.json (archivo
  // especial de Next.js), Next ya genera automáticamente el <link
  // rel="manifest"> apuntando a la URL real que él mismo sirve
  // (/manifest.webmanifest). Declararlo aquí como "/manifest.json" apuntaba
  // a una ruta que no existe -> 404 -> el navegador nunca tuvo un manifest
  // válido, y por eso no había opción de "Instalar app".
};

export const viewport: Viewport = {
  themeColor: "#0D1117",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400;1,600&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-[#0D1117] text-white antialiased" suppressHydrationWarning>
        <ServiceWorkerRegister />
        <ThemeProvider>
          <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}