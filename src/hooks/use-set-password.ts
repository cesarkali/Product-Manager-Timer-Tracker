// Vincula uma senha de e-mail à conta atual (útil para usuários Google que
// querem entrar na extensão, que não suporta o popup OAuth do Google).
// Usa linkWithCredential para contas sem senha e updatePassword para as que já têm.
"use client";

import { useState } from "react";
import {
  EmailAuthProvider,
  linkWithCredential,
  updatePassword,
} from "firebase/auth";
import { auth } from "@/lib/firebase/client";

/** Retorna true se o usuário atual tem o provedor de senha vinculado. */
function hasPasswordProvider(): boolean {
  return (
    auth.currentUser?.providerData.some((p) => p.providerId === "password") ??
    false
  );
}

export function useSetPassword() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasPassword = hasPasswordProvider();

  async function setPassword(newPassword: string): Promise<void> {
    const user = auth.currentUser;
    if (!user?.email) throw new Error("Nenhum usuário autenticado.");

    setLoading(true);
    setError(null);
    try {
      if (hasPasswordProvider()) {
        // Conta já tem senha — apenas atualiza.
        await updatePassword(user, newPassword);
      } else {
        // Conta só tem Google — vincula a senha.
        const credential = EmailAuthProvider.credential(user.email, newPassword);
        await linkWithCredential(user, credential);
      }
    } catch (err) {
      const code =
        err && typeof err === "object" && "code" in err
          ? String((err as { code: string }).code)
          : "desconhecido";
      const message = passwordErrorMessage(code);
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }

  return { hasPassword, setPassword, loading, error };
}

function passwordErrorMessage(code: string): string {
  switch (code) {
    case "auth/weak-password":
      return "Senha fraca demais — use ao menos 6 caracteres.";
    case "auth/requires-recent-login":
      return "Por segurança, saia e entre novamente antes de definir uma senha.";
    case "auth/provider-already-linked":
      return "Este provedor já está vinculado à conta.";
    case "auth/email-already-in-use":
      return "Já existe outra conta com este e-mail.";
    case "auth/network-request-failed":
      return "Sem conexão. Verifique a internet e tente novamente.";
    default:
      return `Não foi possível definir a senha (${code}).`;
  }
}
