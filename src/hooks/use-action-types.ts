"use client";

import { useEffect, useMemo, useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import type { ActionType } from "@/lib/types";
import { useAuth } from "@/hooks/use-auth";
import { DEFAULT_ACTION_TYPES } from "@/lib/default-action-types";
import { voidLog } from "@/lib/activity-log";

// Não há mais seed automático de categorias: várias montagens simultâneas do
// hook viam a coleção vazia ao mesmo tempo e duplicavam o lote (a "trava" via
// transação só lia o flag, não o gravava). As categorias padrão agora só são
// criadas por ação explícita do usuário — botão em Configurações ou no wizard
// de boas-vindas — via restoreDefaultActionTypes, que é idempotente por nome.

export function useActionTypes() {
  const { user } = useAuth();
  const [actionTypes, setActionTypes] = useState<ActionType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const ref = collection(db, "users", user.uid, "actionTypes");
    const unsubscribe = onSnapshot(ref, (snapshot) => {
      const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as ActionType);
      items.sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.name.localeCompare(b.name, "pt-BR"));
      setActionTypes(items);
      setLoading(false);
    });
    return unsubscribe;
  }, [user]);

  const actionTypesById = useMemo(() => {
    const map = new Map<string, ActionType>();
    for (const item of actionTypes) map.set(item.id, item);
    return map;
  }, [actionTypes]);

  async function createActionType(
    name: string,
    icon: string,
    colorTag?: string,
    shortcutKey?: number | null
  ) {
    if (!user) return;
    const ref = collection(db, "users", user.uid, "actionTypes");
    const maxOrder = actionTypes.reduce((max, a) => Math.max(max, a.order ?? 0), -1);
    const hasConflict =
      shortcutKey != null && actionTypes.some((a) => a.shortcutKey === shortcutKey);
    const created = await addDoc(ref, {
      name,
      icon,
      colorTag: colorTag ?? String(actionTypes.length % 8),
      archived: false,
      order: maxOrder + 1,
      shortcutKey: hasConflict ? null : (shortcutKey ?? null),
      createdAt: serverTimestamp(),
    });
    voidLog(db, user.uid, {
      action: "create",
      entity: "actionType",
      entityId: created.id,
      label: name,
    });
  }

  /** Loga uma edição de categoria usando o nome atual conhecido em memória. */
  function logTypeUpdate(id: string, detail: string) {
    if (!user) return;
    const current = actionTypes.find((a) => a.id === id);
    voidLog(db, user.uid, {
      action: "update",
      entity: "actionType",
      entityId: id,
      label: current?.name ?? "Categoria",
      detail,
    });
  }

  async function renameActionType(id: string, name: string) {
    if (!user) return;
    const previous = actionTypes.find((a) => a.id === id)?.name;
    await updateDoc(doc(db, "users", user.uid, "actionTypes", id), { name });
    voidLog(db, user.uid, {
      action: "update",
      entity: "actionType",
      entityId: id,
      label: name,
      detail: previous ? `Renomeada de "${previous}"` : "Renomeada",
    });
  }

  async function setActionTypeIcon(id: string, icon: string) {
    if (!user) return;
    await updateDoc(doc(db, "users", user.uid, "actionTypes", id), { icon });
    logTypeUpdate(id, "Ícone alterado");
  }

  async function setActionTypeColor(id: string, colorTag: string) {
    if (!user) return;
    await updateDoc(doc(db, "users", user.uid, "actionTypes", id), { colorTag });
    logTypeUpdate(id, "Cor alterada");
  }

  /**
   * Define o atalho numérico (1-9) de uma categoria. Recusa silenciosamente
   * se outra categoria já usa a mesma tecla — a UI deve impedir escolher um
   * atalho já ocupado antes mesmo de chamar isso, mas a checagem aqui evita
   * inconsistência caso duas abas editem ao mesmo tempo.
   */
  async function setActionTypeShortcut(id: string, shortcutKey: number | null) {
    if (!user) return;
    if (shortcutKey != null) {
      const conflict = actionTypes.some((a) => a.id !== id && a.shortcutKey === shortcutKey);
      if (conflict) return;
    }
    await updateDoc(doc(db, "users", user.uid, "actionTypes", id), { shortcutKey });
    logTypeUpdate(id, shortcutKey != null ? `Atalho ${shortcutKey}` : "Atalho removido");
  }

  /** Define a área de negócio da categoria (nome de uma BusinessArea ou null). */
  async function setActionTypeArea(id: string, area: string | null) {
    if (!user) return;
    await updateDoc(doc(db, "users", user.uid, "actionTypes", id), { area });
    logTypeUpdate(id, area ? `Área: ${area}` : "Área removida");
  }

  async function setArchived(id: string, archived: boolean) {
    if (!user) return;
    await updateDoc(doc(db, "users", user.uid, "actionTypes", id), { archived });
    logTypeUpdate(id, archived ? "Arquivada" : "Reativada");
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
    const ref = doc(db, "users", user.uid, "actionTypes", id);
    // Snapshot ANTES de apagar — restauração recria com o MESMO id, então os
    // registros antigos que apontam para a categoria voltam a resolver.
    const snap = await getDoc(ref);
    await deleteDoc(ref);
    if (snap.exists()) {
      const data = snap.data();
      voidLog(db, user.uid, {
        action: "delete",
        entity: "actionType",
        entityId: id,
        label: (data.name as string) ?? "Categoria",
        snapshot: data,
      });
    }
  }

  /**
   * Cria as categorias padrão que ainda não existem (por nome) — idempotente:
   * chamar duas vezes não duplica nada. É o único caminho para gerar as
   * categorias padrão (botão em Configurações e no wizard de boas-vindas).
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
    setActionTypeShortcut,
    setActionTypeArea,
    setArchived,
    reorderActionTypes,
    deleteActionType,
    restoreDefaultActionTypes,
  };
}
