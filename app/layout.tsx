import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/lib/auth/auth-context";
import { Toaster } from "@/components/ui/toast";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://diabem.vercel.app/"),
  title: "DiaBem - Acompanhamento Pessoal de Diabetes",
  description:
    "Diário pessoal inteligente de diabetes. Registre glicemia, refeições, atividades e medicamentos. Acompanhe sua rotina de saúde com um companheiro digital acessível e offline.",
  authors: [{ name: "Ruan Valente", url: "https://diabem.vercel.app/" }],
  keywords: [
    "diabetes",
    "glicemia",
    "saúde",
    "acompanhamento",
    "PWA",
    "diário",
  ],
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "DiaBem",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8f9ff" },
    { media: "(prefers-color-scheme: dark)", color: "#0b1c30" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <TooltipProvider>
          <AuthProvider>
            {children}
            <Toaster />
          </AuthProvider>
        </TooltipProvider>
      </body>
    </html>
  );
}
