import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/app-shell/providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PMTT — Product Manager Time Tracker",
  description: "Registro de tempo e evidência de trabalho para PMs",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`dark ${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      // O script abaixo muda atributos do <html> antes da hidratação (tema
      // salvo) — sem isso o React reclama de mismatch server/client.
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        {/* Aplica tema/densidade/cantos salvos antes da hidratação — evita
            piscar a aparência padrão. Temas claros removem a classe dark. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var d=document.documentElement,s=localStorage.getItem("pmtt-skin");if(s){d.setAttribute("data-skin",s);if(s==="claro"||s==="claro-neutro")d.classList.remove("dark")}var n=localStorage.getItem("pmtt-density");if(n)d.setAttribute("data-density",n);var c=localStorage.getItem("pmtt-corners");if(c)d.setAttribute("data-corners",c)}catch(e){}`,
          }}
        />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
