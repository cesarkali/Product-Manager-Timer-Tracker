"use client";

import { useEffect, useState } from "react";
import {
  Timestamp,
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { useAuth } from "@/hooks/use-auth";
import type { DateRange } from "@/lib/time/ranges";
import type { TimeEntry } from "@/lib/types";

export interface ManualEntryData {
  actionTypeId: string;
  actionTypeName: string;
  startTime: Date;
  endTime: Date;
  taskCreated: boolean;
  movideskLink: string | null;
  jiraLink: string | null;
  notes: string | null;
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
      Math.round((data.endTime.getTime() - data.startTime.getTime()) / 1000)
    );
    await addDoc(collection(db, "users", user.uid, "timeEntries"), {
      actionTypeId: data.actionTypeId,
      actionTypeName: data.actionTypeName,
      startTime: Timestamp.fromDate(data.startTime),
      endTime: Timestamp.fromDate(data.endTime),
      durationSeconds,
      taskCreated: data.taskCreated,
      movideskLink: data.movideskLink,
      jiraLink: data.jiraLink,
      notes: data.notes,
      source: "manual",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  async function updateEntry(
    id: string,
    patch: Partial<Pick<TimeEntry, "taskCreated" | "movideskLink" | "jiraLink" | "notes">>
  ) {
    if (!user) return;
    await updateDoc(doc(db, "users", user.uid, "timeEntries", id), {
      ...patch,
      updatedAt: serverTimestamp(),
    });
  }

  async function deleteEntry(id: string) {
    if (!user) return;
    await deleteDoc(doc(db, "users", user.uid, "timeEntries", id));
  }

  return { entries, loading, addManualEntry, updateEntry, deleteEntry };
}
