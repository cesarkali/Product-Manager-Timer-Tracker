"use client";

import { useEffect, useState } from "react";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { useAuth } from "@/hooks/use-auth";

export function useSidebarPreference() {
  const { user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (!user) return;
    const ref = doc(db, "users", user.uid);
    const unsubscribe = onSnapshot(ref, (snap) => {
      setCollapsed(Boolean(snap.data()?.sidebarCollapsed));
    });
    return unsubscribe;
  }, [user]);

  async function setSidebarCollapsed(value: boolean) {
    setCollapsed(value);
    if (!user) return;
    await updateDoc(doc(db, "users", user.uid), { sidebarCollapsed: value });
  }

  return { collapsed, setSidebarCollapsed };
}
