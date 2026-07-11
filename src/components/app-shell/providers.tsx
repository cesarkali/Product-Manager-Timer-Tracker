"use client";

import type { ReactNode } from "react";
import { AuthProvider } from "@/hooks/use-auth";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { useAppearanceSync } from "@/hooks/use-skin";

/** Componente interno: fica dentro do AuthProvider para ter acesso ao
 * useAuth(). Sincroniza aparência do Firestore → localStorage → DOM
 * assim que o usuário autentica (ou ao trocar de conta). */
function AppearanceSyncer() {
  useAppearanceSync();
  return null;
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <TooltipProvider>
        <AppearanceSyncer />
        {children}
        <Toaster richColors position="top-right" />
      </TooltipProvider>
    </AuthProvider>
  );
}

