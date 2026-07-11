"use client";

import { useEffect, useState } from "react";
import { deleteField, doc, onSnapshot, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { useAuth } from "@/hooks/use-auth";
import { APP_VERSION } from "@/lib/changelog";
import type { UserProfile } from "@/lib/types";

/**
 * Flags de primeiro acesso e novidades, lidas do doc `users/{uid}`:
 *  - `needsOnboarding`: sem `onboardingCompletedAt` → mostra o wizard;
 *  - `hasUnseenChangelog`: `lastSeenChangelogVersion` ≠ APP_VERSION → badge
 *    "Novidades" na sidebar (só depois do onboarding, para não empilhar).
 * Todas as escritas usam setDoc com merge de chaves novas — campos existentes
 * do perfil nunca são tocados.
 */
export function useUserFlags() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setLoading(true);
      return;
    }
    const ref = doc(db, "users", user.uid);
    const unsubscribe = onSnapshot(ref, (snap) => {
      setProfile(snap.exists() ? (snap.data() as UserProfile) : null);
      setLoading(false);
    });
    return unsubscribe;
  }, [user]);

  const needsOnboarding = !loading && !profile?.onboardingCompletedAt;
  const hasUnseenChangelog =
    !loading &&
    Boolean(profile?.onboardingCompletedAt) &&
    profile?.lastSeenChangelogVersion !== APP_VERSION;

  async function completeOnboarding() {
    if (!user) return;
    await setDoc(
      doc(db, "users", user.uid),
      {
        termsAcceptedAt: serverTimestamp(),
        onboardingCompletedAt: serverTimestamp(),
        // Quem acabou de fazer o tour não precisa do badge de novidades já.
        lastSeenChangelogVersion: APP_VERSION,
      },
      { merge: true }
    );
  }

  /** Reabre o tour de boas-vindas (botão "Rever tour" em Novidades). Remove
   * só o flag de conclusão — o aceite dos termos (termsAcceptedAt) fica. */
  async function resetOnboarding() {
    if (!user) return;
    await setDoc(
      doc(db, "users", user.uid),
      { onboardingCompletedAt: deleteField() },
      { merge: true }
    );
  }

  async function markChangelogSeen() {
    if (!user) return;
    await setDoc(
      doc(db, "users", user.uid),
      { lastSeenChangelogVersion: APP_VERSION },
      { merge: true }
    );
  }

  return {
    loading,
    profile,
    needsOnboarding,
    hasUnseenChangelog,
    completeOnboarding,
    resetOnboarding,
    markChangelogSeen,
  };
}
