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
import type { ActiveTimer, ActionType, LinkedTask } from "@/lib/types";
import { formatDuration } from "@/lib/time/format";

export interface ActiveTimerFields {
  tasks: LinkedTask[];
  comments: string | null;
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
    if (!activeTimer) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [activeTimer]);

  const elapsedSeconds =
    activeTimer && activeTimer.startTime
      ? Math.max(0, Math.floor((now - activeTimer.startTime.toMillis()) / 1000))
      : 0;

  async function startTimer(nextActionType: ActionType, previousActionType?: ActionType | null) {
    if (!user) return;
    const batch = writeBatch(db);
    const activeTimerRef = doc(db, "users", user.uid, "activeTimer", "current");

    let previousLabel: string | null = null;
    if (activeTimer) {
      const entryRef = doc(collection(db, "users", user.uid, "timeEntries"));
      const startedAt = activeTimer.startTime.toDate();
      const endedAt = new Date();
      const durationSeconds = Math.max(
        0,
        Math.round((endedAt.getTime() - startedAt.getTime()) / 1000)
      );
      const previousTasks = activeTimer.tasks ?? [];
      batch.set(entryRef, {
        actionTypeId: activeTimer.actionTypeId,
        actionTypeName: previousActionType?.name ?? "Categoria",
        startTime: Timestamp.fromDate(startedAt),
        endTime: Timestamp.fromDate(endedAt),
        durationSeconds,
        taskCreated: previousTasks.some((task) => task.type === "jira"),
        tasks: previousTasks,
        notes: activeTimer.comments ?? null,
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
    const endedAt = new Date();
    const durationSeconds = Math.max(
      0,
      Math.round((endedAt.getTime() - startedAt.getTime()) / 1000)
    );

    const tasks = activeTimer.tasks ?? [];
    batch.set(entryRef, {
      actionTypeId: activeTimer.actionTypeId,
      actionTypeName,
      startTime: Timestamp.fromDate(startedAt),
      endTime: Timestamp.fromDate(endedAt),
      durationSeconds,
      taskCreated: tasks.some((task) => task.type === "jira"),
      tasks,
      notes: activeTimer.comments ?? null,
      source: "timer",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    batch.delete(activeTimerRef);

    await batch.commit();
    toast.success(`Parou "${actionTypeName}" (${formatDuration(durationSeconds)})`);
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
    await updateDoc(doc(db, "users", user.uid, "activeTimer", "current"), normalized);
  }

  async function discardTimer() {
    if (!user) return;
    await deleteDoc(doc(db, "users", user.uid, "activeTimer", "current"));
  }

  return {
    activeTimer,
    loading,
    elapsedSeconds,
    startTimer,
    stopTimer,
    updateActiveTimerFields,
    discardTimer,
  };
}
