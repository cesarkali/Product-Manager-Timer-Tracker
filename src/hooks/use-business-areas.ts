"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  addDoc,
  collection,
  doc,
  getDocs,
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { useAuth } from "@/hooks/use-auth";
import { DEFAULT_BUSINESS_AREAS } from "@/lib/default-business-areas";
import type { BusinessArea } from "@/lib/types";

async function seedDefaultBusinessAreas(uid: string) {
  const userRef = doc(db, "users", uid);

  // Mesma trava (via transação) do seed de categorias — evita duplicar o lote
  // se a checagem disparar em paralelo por mais de um listener/montagem.
  const shouldSeed = await runTransaction(db, async (transaction) => {
    const snap = await transaction.get(userRef);
    return !(snap.exists() && snap.data().hasSeededBusinessAreas);
  });
  if (!shouldSeed) return;

  const ref = collection(db, "users", uid, "businessAreas");
  const batch = writeBatch(db);
  DEFAULT_BUSINESS_AREAS.forEach(({ name, colorTag }, index) => {
    const docRef = doc(ref);
    batch.set(docRef, {
      name,
      colorTag,
      archived: false,
      order: index,
      createdAt: serverTimestamp(),
    });
  });
  await batch.commit();

  await updateDoc(userRef, { hasSeededBusinessAreas: true });
}

export function useBusinessAreas() {
  const { user } = useAuth();
  const [businessAreas, setBusinessAreas] = useState<BusinessArea[]>([]);
  const [loading, setLoading] = useState(true);
  const hasCheckedSeedRef = useRef(false);

  useEffect(() => {
    if (!user) return;
    hasCheckedSeedRef.current = false;
    const ref = collection(db, "users", user.uid, "businessAreas");
    const unsubscribe = onSnapshot(ref, (snapshot) => {
      const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as BusinessArea);
      items.sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.name.localeCompare(b.name, "pt-BR"));
      setBusinessAreas(items);
      setLoading(false);

      if (!hasCheckedSeedRef.current) {
        hasCheckedSeedRef.current = true;
        if (snapshot.empty) {
          void seedDefaultBusinessAreas(user.uid);
        }
      }
    });
    return unsubscribe;
  }, [user]);

  const activeBusinessAreas = useMemo(
    () => businessAreas.filter((a) => !a.archived),
    [businessAreas]
  );

  function isDuplicateName(name: string, ignoreId?: string): boolean {
    const normalized = name.trim().toLowerCase();
    return businessAreas.some(
      (area) => area.id !== ignoreId && area.name.toLowerCase() === normalized
    );
  }

  async function createBusinessArea(name: string, colorTag?: string) {
    if (!user) return;
    const trimmed = name.trim();
    if (!trimmed || isDuplicateName(trimmed)) return;
    const ref = collection(db, "users", user.uid, "businessAreas");
    const maxOrder = businessAreas.reduce((max, a) => Math.max(max, a.order ?? 0), -1);
    await addDoc(ref, {
      name: trimmed,
      colorTag: colorTag ?? String(businessAreas.length % 8),
      archived: false,
      order: maxOrder + 1,
      createdAt: serverTimestamp(),
    });
  }

  /**
   * Renomeia a área e propaga o novo nome para todas as categorias que
   * referenciam o nome antigo (o vínculo categoria↔área é por nome, não por
   * id) — sem isso, renomear "descolaria" silenciosamente as categorias já
   * atribuídas a essa área.
   */
  async function renameBusinessArea(id: string, name: string) {
    if (!user) return;
    const trimmed = name.trim();
    if (!trimmed || isDuplicateName(trimmed, id)) return;
    const current = businessAreas.find((a) => a.id === id);
    if (!current || current.name === trimmed) return;

    const actionTypesRef = collection(db, "users", user.uid, "actionTypes");
    const affected = await getDocs(query(actionTypesRef, where("area", "==", current.name)));

    const batch = writeBatch(db);
    batch.update(doc(db, "users", user.uid, "businessAreas", id), { name: trimmed });
    affected.forEach((actionTypeDoc) => {
      batch.update(actionTypeDoc.ref, { area: trimmed });
    });
    await batch.commit();
  }

  async function setBusinessAreaColor(id: string, colorTag: string) {
    if (!user) return;
    await updateDoc(doc(db, "users", user.uid, "businessAreas", id), { colorTag });
  }

  async function setBusinessAreaArchived(id: string, archived: boolean) {
    if (!user) return;
    await updateDoc(doc(db, "users", user.uid, "businessAreas", id), { archived });
  }

  /**
   * Exclui a área. Categorias que a usam não são apagadas nem quebram — só
   * têm o campo `area` desvinculado (voltam a "Sem área"), já que a área
   * excluída deixa de existir para ser referenciada. Reversível: basta
   * reatribuir a área desejada de novo na tabela de categorias.
   */
  async function deleteBusinessArea(id: string) {
    if (!user) return;
    const current = businessAreas.find((a) => a.id === id);
    if (!current) return;

    const actionTypesRef = collection(db, "users", user.uid, "actionTypes");
    const affected = await getDocs(query(actionTypesRef, where("area", "==", current.name)));

    const batch = writeBatch(db);
    affected.forEach((actionTypeDoc) => {
      batch.update(actionTypeDoc.ref, { area: null });
    });
    batch.delete(doc(db, "users", user.uid, "businessAreas", id));
    await batch.commit();
  }

  /**
   * Cria as áreas padrão que ainda não existem (por nome), ignorando a trava
   * de seed automático. Mesmo botão/uso que `restoreDefaultActionTypes` das
   * categorias — útil se o seed automático não rodou (ex.: painel aberto
   * antes das regras do Firestore serem republicadas com `businessAreas`).
   */
  async function restoreDefaultBusinessAreas() {
    if (!user) return;
    const existingNames = new Set(businessAreas.map((a) => a.name.toLowerCase()));
    const missing = DEFAULT_BUSINESS_AREAS.filter(
      (d) => !existingNames.has(d.name.toLowerCase())
    );
    if (missing.length === 0) return;

    const ref = collection(db, "users", user.uid, "businessAreas");
    const maxOrder = businessAreas.reduce((max, a) => Math.max(max, a.order ?? 0), -1);
    const batch = writeBatch(db);
    missing.forEach(({ name, colorTag }, index) => {
      const docRef = doc(ref);
      batch.set(docRef, {
        name,
        colorTag,
        archived: false,
        order: maxOrder + 1 + index,
        createdAt: serverTimestamp(),
      });
    });
    await batch.commit();
    await updateDoc(doc(db, "users", user.uid), { hasSeededBusinessAreas: true });
  }

  return {
    businessAreas,
    activeBusinessAreas,
    loading,
    isDuplicateName,
    createBusinessArea,
    renameBusinessArea,
    setBusinessAreaColor,
    setBusinessAreaArchived,
    deleteBusinessArea,
    restoreDefaultBusinessAreas,
  };
}
