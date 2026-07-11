import type { Metadata } from "next";
import { ShieldCheck } from "lucide-react";
import { TermsContent } from "@/components/legal/terms-content";

export const metadata: Metadata = {
  title: "Termos de Uso e Privacidade | PMTT",
  description:
    "Termos de Uso e Política de Privacidade do PMTT — plataforma de registro de tempo e extensão do Chrome.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="relative min-h-svh px-4 py-12 sm:px-6 lg:px-8">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-50"
        style={{
          background:
            "radial-gradient(50% 30% at 50% 0%, color-mix(in oklch, var(--primary) 12%, transparent), transparent 70%)",
        }}
      />
      <div className="relative mx-auto max-w-3xl rounded-3xl border bg-card p-8 shadow-xl sm:p-10">
        <div className="mb-8 flex items-start gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/60 shadow-lg shadow-primary/25">
            <ShieldCheck className="h-6 w-6 text-primary-foreground" />
          </span>
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Termos de Uso e Política de Privacidade
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              PMTT — Product Manager Time Tracker (plataforma web e extensão do Chrome)
            </p>
          </div>
        </div>
        <TermsContent />
        <p className="mt-10 border-t pt-5 text-center text-xs text-muted-foreground">
          Powered by{" "}
          <a
            href="https://caliberda.com.br"
            target="_blank"
            rel="noreferrer"
            className="underline-offset-2 hover:text-foreground hover:underline"
          >
            caliberda.com.br
          </a>{" "}
          ·{" "}
          <a
            href="https://instagram.com/cesar.kali"
            target="_blank"
            rel="noreferrer"
            className="underline-offset-2 hover:text-foreground hover:underline"
          >
            @cesar.kali
          </a>
        </p>
      </div>
    </div>
  );
}
