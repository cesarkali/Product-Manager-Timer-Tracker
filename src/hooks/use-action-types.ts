"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  runTransaction,
  serverTimestamp,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import type { ActionType } from "@/lib/types";
import { useAuth } from "@/hooks/use-auth";
import { DEFAULT_ACTION_TYPES } from "@/lib/default-action-types";

async function seedDefaultActionTypes(uid: string) {
  const userRef = doc(db, "users", uid);

  // Trava no doc do usuário: evita que múltiplos listeners/montagens
  // disparando a checagem em paralelo criem o mesmo lote de categorias mais
  // de uma vez. Importante: só é marcada como concluída DEPOIS que o
  // batch.commit() das categorias tiver sucesso — se marcássemos antes e o
  // commit falhasse (ex.: por um erro transitório), o usuário ficaria travado
  // permanentemente sem categorias, já que a trava indicaria "já semeado".
  const shouldSeed = await runTransaction(db, async (transaction) => {
    const snap = await transaction.get(userRef);
    return !(snap.exists() && snap.data().hasSeededActionTypes);
  });
  if (!shouldSeed) return;

  const ref = collection(db, "users", uid, "actionTypes");
  const batch = writeBatch(db);
  DEFAULT_ACTION_TYPES.forEach(({ name, icon, colorTag }, index) => {
    const docRef = doc(ref);
    batch.set(docRef, {
      name,
      icon,
      colorTag,
      archived: false,
      order: index,
      createdAt: serverTimestamp(),
    });
  });
  await batch.commit();

  await updateDoc(userRef, { hasSeededActionTypes: true });
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
      items.sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.name.localeCompare(b.name, "pt-BR"));
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

  async function createActionType(name: string, icon: string, colorTag?: string) {
    if (!user) return;
    const ref = collection(db, "users", user.uid, "actionTypes");
    const maxOrder = actionTypes.reduce((max, a) => Math.max(max, a.order ?? 0), -1);
    await addDoc(ref, {
      name,
      icon,
      colorTag: colorTag ?? String(actionTypes.length % 8),
      archived: false,
      order: maxOrder + 1,
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

  async function setActionTypeColor(id: string, colorTag: string) {
    if (!user) return;
    await updateDoc(doc(db, "users", user.uid, "actionTypes", id), { colorTag });
  }

  async function setArchived(id: string, archived: boolean) {
    if (!user) return;
    await updateDoc(doc(db, "users", user.uid, "actionTypes", id), { archived });
  }

  /** Grava a nova ordem completa (ex.: após um drag-and-drop na tabela). */
  async function reorderActionTypes(orderedIds: string[]) {
    if (!user) return;
    const batch = writeBatch(db);
    orderedIds.forEach((id, index) => {
      batch.update(doc(db, "users", user.uid, "actionTypes", id), { order: index });
    });
    await batch.commit();
  }

  async function deleteActionType(id: string) {
    if (!user) return;
    await deleteDoc(doc(db, "users", user.uid, "actionTypes", id));
  }

  /**
   * Cria as categorias padrão que ainda não existem (por nome), ignorando a
   * trava de seed automático. Útil para contas que ficaram sem categorias por
   * causa do bug de corrida do seed automático (trava marcada sem o commit
   * ter sido concluído).
   */
  async function restoreDefaultActionTypes() {
    if (!user) return;
    const existingNames = new Set(actionTypes.map((a) => a.name));
    const missing = DEFAULT_ACTION_TYPES.filter((d) => !existingNames.has(d.name));
    if (missing.length === 0) return;

    const ref = collection(db, "users", user.uid, "actionTypes");
    const maxOrder = actionTypes.reduce((max, a) => Math.max(max, a.order ?? 0), -1);
    const batch = writeBatch(db);
    missing.forEach(({ name, icon, colorTag }, index) => {
      const docRef = doc(ref);
      batch.set(docRef, {
        name,
        icon,
        colorTag,
        archived: false,
        order: maxOrder + 1 + index,
        createdAt: serverTimestamp(),
      });
    });
    await batch.commit();
    await updateDoc(doc(db, "users", user.uid), { hasSeededActionTypes: true });
  }

  return {
    actionTypes,
    activeActionTypes: actionTypes.filter((a) => !a.archived),
    actionTypesById,
    loading,
    createActionType,
    renameActionType,
    setActionTypeIcon,
    setActionTypeColor,
    setArchived,
    reorderActionTypes,
    deleteActionType,
    restoreDefaultActionTypes,
  };
}
