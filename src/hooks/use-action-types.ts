"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import type { ActionType } from "@/lib/types";
import { useAuth } from "@/hooks/use-auth";
import { DEFAULT_ACTION_TYPES } from "@/lib/default-action-types";

async function seedDefaultActionTypes(uid: string) {
  const ref = collection(db, "users", uid, "actionTypes");
  const batch = writeBatch(db);
  DEFAULT_ACTION_TYPES.forEach(({ name, icon }, index) => {
    const docRef = doc(ref);
    batch.set(docRef, {
      name,
      icon,
      colorTag: String(index % 8),
      archived: false,
      createdAt: serverTimestamp(),
    });
  });
  await batch.commit();
}

export function useActionTypes() {
  const { user } = useAuth();
  const [actionTypes, setActionTypes] = useState<ActionType[]>([]);
  const [loading, setLoading] = useState(true);
  const hasCheckedSeedRef = useRef(false);

  useEffect(() => {
    if (!user) return;
    hasCheckedSeedRef.current = false;
    const ref = collection(db, "users", user.uid, "actionTypes");
    const unsubscribe = onSnapshot(ref, (snapshot) => {
      const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as ActionType);
      items.sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
      setActionTypes(items);
      setLoading(false);

      if (!hasCheckedSeedRef.current) {
        hasCheckedSeedRef.current = true;
        if (snapshot.empty) {
          void seedDefaultActionTypes(user.uid);
        }
      }
    });
    return unsubscribe;
  }, [user]);

  const actionTypesById = useMemo(() => {
    const map = new Map<string, ActionType>();
    for (const item of actionTypes) map.set(item.id, item);
    return map;
  }, [actionTypes]);

  async function createActionType(name: string, icon: string) {
    if (!user) return;
    const ref = collection(db, "users", user.uid, "actionTypes");
    await addDoc(ref, {
      name,
      icon,
      colorTag: String(actionTypes.length % 8),
      archived: false,
      createdAt: serverTimestamp(),
    });
  }

  async function renameActionType(id: string, name: string) {
    if (!user) return;
    await updateDoc(doc(db, "users", user.uid, "actionTypes", id), { name });
  }

  async function setActionTypeIcon(id: string, icon: string) {
    if (!user) return;
    await updateDoc(doc(db, "users", user.uid, "actionTypes", id), { icon });
  }

  async function setArchived(id: string, archived: boolean) {
    if (!user) return;
    await updateDoc(doc(db, "users", user.uid, "actionTypes", id), { archived });
  }

  async function deleteActionType(id: string) {
    if (!user) return;
    await deleteDoc(doc(db, "users", user.uid, "actionTypes", id));
  }

  return {
    actionTypes,
    activeActionTypes: actionTypes.filter((a) => !a.archived),
    actionTypesById,
    loading,
    createActionType,
    renameActionType,
    setActionTypeIcon,
    setArchived,
    deleteActionType,
  };
}
