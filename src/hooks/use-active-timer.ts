"use client";

import { useEffect, useState } from "react";
import {
  Timestamp,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import { toast } from "sonner";
import { db } from "@/lib/firebase/client";
import { useAuth } from "@/hooks/use-auth";
import { DESCRIPTION_MAX_LENGTH, type ActiveTimer, type ActionType, type LinkedTask } from "@/lib/types";
import { formatDuration } from "@/lib/time/format";

export interface ActiveTimerFields {
  tasks: LinkedTask[];
  comments: string | null;
  description: string | null;
}

/** Tempo decorrido (ms) de um cronômetro, descontando os intervalos pausados.
 * Congelado em `pausedAt` enquanto pausado — não avança com `nowMs`. Docs
 * criados antes da funcionalidade de pausa não têm `pausedAt`/
 * `accumulatedPausedSeconds`, então tratamos como "nunca pausado". `startTime`
 * usa `serverTimestamp()` e fica momentaneamente `null` no snapshot local até
 * o servidor confirmar — nesse instante retornamos 0 em vez de estourar. */
export function computeElapsedMs(activeTimer: ActiveTimer, nowMs: number): number {
  if (!activeTimer.startTime) return 0;
  const accumulatedPausedMs = (activeTimer.accumulatedPausedSeconds ?? 0) * 1000;
  const referenceMs = activeTimer.pausedAt ? activeTimer.pausedAt.toMillis() : nowMs;
  return Math.max(0, referenceMs - activeTimer.startTime.toMillis() - accumulatedPausedMs);
}

export function useActiveTimer() {
  const { user } = useAuth();
  const [activeTimer, setActiveTimer] = useState<ActiveTimer | null>(null);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!user) return;
    const ref = doc(db, "users", user.uid, "activeTimer", "current");
    const unsubscribe = onSnapshot(ref, (snap) => {
      setActiveTimer(snap.exists() ? (snap.data() as ActiveTimer) : null);
      setLoading(false);
    });
    return unsubscribe;
  }, [user]);

  useEffect(() => {
    if (!activeTimer || activeTimer.pausedAt) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [activeTimer]);

  const isPaused = Boolean(activeTimer?.pausedAt);
  const elapsedSeconds = activeTimer ? Math.floor(computeElapsedMs(activeTimer, now) / 1000) : 0;

  async function startTimer(nextActionType: ActionType, previousActionType?: ActionType | null) {
    if (!user) return;
    const batch = writeBatch(db);
    const activeTimerRef = doc(db, "users", user.uid, "activeTimer", "current");

    let previousLabel: string | null = null;
    if (activeTimer) {
      const entryRef = doc(collection(db, "users", user.uid, "timeEntries"));
      const startedAt = activeTimer.startTime.toDate();
      // Se estava pausado, o fim real do trabalho é o momento da pausa, não agora.
      const endedAt = activeTimer.pausedAt ? activeTimer.pausedAt.toDate() : new Date();
      const durationSeconds = Math.round(computeElapsedMs(activeTimer, endedAt.getTime()) / 1000);
      const previousTasks = activeTimer.tasks ?? [];
      batch.set(entryRef, {
        actionTypeId: activeTimer.actionTypeId,
        actionTypeName: previousActionType?.name ?? "Categoria",
        startTime: Timestamp.fromDate(startedAt),
        endTime: Timestamp.fromDate(endedAt),
        durationSeconds,
        pausedSeconds: activeTimer.accumulatedPausedSeconds ?? 0,
        taskCreated: previousTasks.some((task) => task.type === "jira"),
        tasks: previousTasks,
        notes: activeTimer.comments ?? null,
        description: activeTimer.description ?? null,
        source: "timer",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      previousLabel = formatDuration(durationSeconds);
    }

    batch.set(activeTimerRef, {
      actionTypeId: nextActionType.id,
      startTime: serverTimestamp(),
      tasks: [],
      comments: null,
      description: null,
      pausedAt: null,
      accumulatedPausedSeconds: 0,
    });

    await batch.commit();

    if (previousLabel) {
      toast.success(`Parou anterior (${previousLabel}) · Iniciou "${nextActionType.name}"`);
    } else {
      toast.success(`Iniciou "${nextActionType.name}"`);
    }
  }

  async function stopTimer(actionTypeName: string) {
    if (!user || !activeTimer) return;
    const batch = writeBatch(db);
    const activeTimerRef = doc(db, "users", user.uid, "activeTimer", "current");
    const entryRef = doc(collection(db, "users", user.uid, "timeEntries"));
    const startedAt = activeTimer.startTime.toDate();
    // Se estava pausado, o fim real do trabalho é o momento da pausa, não agora.
    const endedAt = activeTimer.pausedAt ? activeTimer.pausedAt.toDate() : new Date();
    const durationSeconds = Math.round(computeElapsedMs(activeTimer, endedAt.getTime()) / 1000);

    const tasks = activeTimer.tasks ?? [];
    batch.set(entryRef, {
      actionTypeId: activeTimer.actionTypeId,
      actionTypeName,
      startTime: Timestamp.fromDate(startedAt),
      endTime: Timestamp.fromDate(endedAt),
      durationSeconds,
      pausedSeconds: activeTimer.accumulatedPausedSeconds ?? 0,
      taskCreated: tasks.some((task) => task.type === "jira"),
      tasks,
      notes: activeTimer.comments ?? null,
      description: activeTimer.description ?? null,
      source: "timer",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    batch.delete(activeTimerRef);

    await batch.commit();
    toast.success(`Parou "${actionTypeName}" (${formatDuration(durationSeconds)})`);
  }

  async function pauseTimer() {
    if (!user || !activeTimer || activeTimer.pausedAt) return;
    await updateDoc(doc(db, "users", user.uid, "activeTimer", "current"), {
      pausedAt: serverTimestamp(),
    });
  }

  async function resumeTimer() {
    if (!user || !activeTimer || !activeTimer.pausedAt) return;
    const pausedSpanSeconds = Math.max(
      0,
      Math.round((Date.now() - activeTimer.pausedAt.toMillis()) / 1000)
    );
    await updateDoc(doc(db, "users", user.uid, "activeTimer", "current"), {
      pausedAt: null,
      accumulatedPausedSeconds: (activeTimer.accumulatedPausedSeconds ?? 0) + pausedSpanSeconds,
    });
  }

  async function updateActiveTimerFields(patch: Partial<ActiveTimerFields>) {
    if (!user || !activeTimer) return;
    const normalized: Record<string, string | null | LinkedTask[]> = {};
    if ("tasks" in patch) {
      normalized.tasks = patch.tasks ?? [];
    }
    if ("comments" in patch) {
      const value = patch.comments;
      normalized.comments = value && value.trim() ? value.trim().slice(0, 1000) : null;
    }
    if ("description" in patch) {
      const value = patch.description;
      normalized.description =
        value && value.trim() ? value.trim().slice(0, DESCRIPTION_MAX_LENGTH) : null;
    }
    await updateDoc(doc(db, "users", user.uid, "activeTimer", "current"), normalized);
  }

  /** Corrige o horário de início do cronômetro em andamento ("na real comecei
   * 10 minutos atrás"). Recusa início no futuro e, se pausado, início depois da
   * pausa — retorna false para a UI avisar. Não mexe em
   * `accumulatedPausedSeconds`; o tempo decorrido se recalcula sozinho. */
  async function adjustStartTime(newStart: Date): Promise<boolean> {
    if (!user || !activeTimer || !activeTimer.startTime) return false;
    const limitMs = activeTimer.pausedAt ? activeTimer.pausedAt.toMillis() : Date.now();
    if (newStart.getTime() >= limitMs) return false;
    await updateDoc(doc(db, "users", user.uid, "activeTimer", "current"), {
      startTime: Timestamp.fromDate(newStart),
    });
    return true;
  }

  async function discardTimer() {
    if (!user) return;
    await deleteDoc(doc(db, "users", user.uid, "activeTimer", "current"));
  }

  return {
    activeTimer,
    loading,
    elapsedSeconds,
    isPaused,
    startTimer,
    stopTimer,
    pauseTimer,
    resumeTimer,
    updateActiveTimerFields,
    adjustStartTime,
    discardTimer,
  };
}
