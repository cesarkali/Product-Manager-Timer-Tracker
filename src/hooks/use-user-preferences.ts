"use client";

import { useEffect, useState } from "react";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { useAuth } from "@/hooks/use-auth";
import type { UserProfile } from "@/lib/types";

export interface ReminderPreferences {
  reminderEnabled: boolean;
  reminderMinutes: number;
  workStart: string;
  workEnd: string;
  workDays: number[];
}

export const DEFAULT_PREFERENCES: ReminderPreferences = {
  reminderEnabled: false,
  reminderMinutes: 15,
  workStart: "08:00",
  workEnd: "18:00",
  workDays: [1, 2, 3, 4, 5],
};

/** Preferências do usuário (lembrete + expediente) guardadas no próprio doc
 * `users/{uid}` — sempre gravadas via `updateDoc` com patch de chaves, nunca
 * `setDoc`, para preservar `hasSeededActionTypes`/`sidebarCollapsed`. */
export function useUserPreferences() {
  const { user } = useAuth();
  const [prefs, setPrefs] = useState<ReminderPreferences>(DEFAULT_PREFERENCES);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const ref = doc(db, "users", user.uid);
    const unsubscribe = onSnapshot(ref, (snap) => {
      const data = snap.data() as UserProfile | undefined;
      setPrefs({
        reminderEnabled: data?.reminderEnabled ?? DEFAULT_PREFERENCES.reminderEnabled,
        reminderMinutes: data?.reminderMinutes ?? DEFAULT_PREFERENCES.reminderMinutes,
        workStart: data?.workStart ?? DEFAULT_PREFERENCES.workStart,
        workEnd: data?.workEnd ?? DEFAULT_PREFERENCES.workEnd,
        workDays: data?.workDays ?? DEFAULT_PREFERENCES.workDays,
      });
      setLoading(false);
    });
    return unsubscribe;
  }, [user]);

  async function updatePreferences(patch: Partial<ReminderPreferences>) {
    if (!user) return;
    await updateDoc(doc(db, "users", user.uid), patch);
  }

  return { prefs, loading, updatePreferences };
}
