"use client";

import { useEffect, useState } from "react";
import {
  Timestamp,
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { useAuth } from "@/hooks/use-auth";
import { voidLog } from "@/lib/activity-log";
import type { DateRange } from "@/lib/time/ranges";
import { DESCRIPTION_MAX_LENGTH, type LinkedTask, type TimeEntry } from "@/lib/types";

export interface ManualEntryData {
  actionTypeId: string;
  actionTypeName: string;
  startTime: Date;
  endTime: Date;
  taskCreated: boolean;
  tasks: LinkedTask[];
  notes: string | null;
  /** Descrição curta do que estava sendo feito (≤ DESCRIPTION_MAX_LENGTH). */
  description?: string | null;
  /** Segundos pausados a descontar de `endTime - startTime` (só relevante ao
   * editar um registro vindo do cronômetro que foi pausado; nunca preenchido
   * por lançamento manual). */
  pausedSeconds?: number;
}

/** Firestore rejeita `undefined` — vazio/ausente vira sempre `null`. */
function normalizeDescription(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed.slice(0, DESCRIPTION_MAX_LENGTH) : null;
}

/** Rótulo humano de um registro para o log de atividade. */
function entryLabel(actionTypeName: string, start: Date): string {
  return `${actionTypeName} — ${start.toLocaleDateString("pt-BR")} ${start
    .toTimeString()
    .slice(0, 5)}`;
}

export function useTimeEntries(range: DateRange) {
  const { user } = useAuth();
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const rangeStartMs = range.start.getTime();
  const rangeEndMs = range.end.getTime();

  useEffect(() => {
    if (!user) return;
    const ref = collection(db, "users", user.uid, "timeEntries");
    const q = query(
      ref,
      where("startTime", ">=", Timestamp.fromDate(new Date(rangeStartMs))),
      where("startTime", "<=", Timestamp.fromDate(new Date(rangeEndMs))),
      orderBy("startTime", "desc")
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setEntries(snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as TimeEntry));
      setLoading(false);
    });
    return unsubscribe;
  }, [user, rangeStartMs, rangeEndMs]);

  async function addManualEntry(data: ManualEntryData) {
    if (!user) return;
    const durationSeconds = Math.max(
      0,
      Math.round((data.endTime.getTime() - data.startTime.getTime()) / 1000) -
        (data.pausedSeconds ?? 0)
    );
    const ref = await addDoc(collection(db, "users", user.uid, "timeEntries"), {
      actionTypeId: data.actionTypeId,
      actionTypeName: data.actionTypeName,
      startTime: Timestamp.fromDate(data.startTime),
      endTime: Timestamp.fromDate(data.endTime),
      durationSeconds,
      pausedSeconds: data.pausedSeconds ?? 0,
      taskCreated: data.taskCreated || data.tasks.some((task) => task.type === "jira"),
      tasks: data.tasks,
      notes: data.notes,
      description: normalizeDescription(data.description),
      source: "manual",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    voidLog(db, user.uid, {
      action: "create",
      entity: "timeEntry",
      entityId: ref.id,
      label: entryLabel(data.actionTypeName, data.startTime),
      detail: "Lançamento manual",
    });
  }

  async function updateEntry(
    id: string,
    patch: Partial<Pick<TimeEntry, "taskCreated" | "tasks" | "notes">>
  ) {
    if (!user) return;
    await updateDoc(doc(db, "users", user.uid, "timeEntries", id), {
      ...patch,
      updatedAt: serverTimestamp(),
    });
    const current = entries.find((entry) => entry.id === id);
    voidLog(db, user.uid, {
      action: "update",
      entity: "timeEntry",
      entityId: id,
      label: current
        ? entryLabel(current.actionTypeName, current.startTime.toDate())
        : "Registro",
      detail: Object.keys(patch).join(", "),
    });
  }

  async function updateEntryFull(id: string, data: ManualEntryData) {
    if (!user) return;
    // Desconta o tempo pausado (se o registro veio do cronômetro e foi
    // pausado) para editar sem reintroduzir esse intervalo na duração.
    const durationSeconds = Math.max(
      0,
      Math.round((data.endTime.getTime() - data.startTime.getTime()) / 1000) -
        (data.pausedSeconds ?? 0)
    );
    await updateDoc(doc(db, "users", user.uid, "timeEntries", id), {
      actionTypeId: data.actionTypeId,
      actionTypeName: data.actionTypeName,
      startTime: Timestamp.fromDate(data.startTime),
      endTime: Timestamp.fromDate(data.endTime),
      durationSeconds,
      pausedSeconds: data.pausedSeconds ?? 0,
      taskCreated: data.taskCreated || data.tasks.some((task) => task.type === "jira"),
      tasks: data.tasks,
      notes: data.notes,
      description: normalizeDescription(data.description),
      updatedAt: serverTimestamp(),
    });
    voidLog(db, user.uid, {
      action: "update",
      entity: "timeEntry",
      entityId: id,
      label: entryLabel(data.actionTypeName, data.startTime),
      detail: "Edição completa",
    });
  }

  async function deleteEntry(id: string) {
    if (!user) return;
    const ref = doc(db, "users", user.uid, "timeEntries", id);
    // Snapshot ANTES de apagar — é ele que permite restaurar pelo log.
    const snap = await getDoc(ref);
    await deleteDoc(ref);
    if (snap.exists()) {
      const data = snap.data();
      voidLog(db, user.uid, {
        action: "delete",
        entity: "timeEntry",
        entityId: id,
        label: entryLabel(
          (data.actionTypeName as string) ?? "Registro",
          (data.startTime as Timestamp).toDate()
        ),
        snapshot: data,
      });
    }
  }

  return { entries, loading, addManualEntry, updateEntry, updateEntryFull, deleteEntry };
}
