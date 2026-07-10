// Operações do cronômetro portadas de src/hooks/use-active-timer.ts como
// funções puras (db + uid explícitos) para rodarem fora do React — no service
// worker, no popup e na página de opções. CRÍTICO: o formato dos documentos
// gravados aqui deve ser idêntico ao do app web, senão as firestore.rules
// rejeitam a escrita. Qualquer mudança lá deve ser espelhada aqui.
import {
  Timestamp,
  collection,
  deleteDoc,
  doc,
  serverTimestamp,
  updateDoc,
  writeBatch,
  type Firestore,
} from "firebase/firestore";
import {
  DESCRIPTION_MAX_LENGTH,
  type ActiveTimer,
  type LinkedTask,
} from "@/lib/types";

export interface ActiveTimerFields {
  tasks: LinkedTask[];
  comments: string | null;
  description: string | null;
}

/** Tempo decorrido (ms) descontando pausas — mesma lógica do app web. */
export function computeElapsedMs(activeTimer: ActiveTimer, nowMs: number): number {
  if (!activeTimer.startTime) return 0;
  const accumulatedPausedMs = (activeTimer.accumulatedPausedSeconds ?? 0) * 1000;
  const referenceMs = activeTimer.pausedAt ? activeTimer.pausedAt.toMillis() : nowMs;
  return Math.max(0, referenceMs - activeTimer.startTime.toMillis() - accumulatedPausedMs);
}

export function activeTimerRef(db: Firestore, uid: string) {
  return doc(db, "users", uid, "activeTimer", "current");
}

/** Monta o TimeEntry a partir de um cronômetro sendo encerrado — exatamente os
 * mesmos campos que o app web grava (taskCreated = tem task do Jira). */
function buildEntryData(activeTimer: ActiveTimer, actionTypeName: string) {
  if (!activeTimer.startTime) {
    throw new Error("O cronômetro ainda está sincronizando — tente de novo em instantes.");
  }
  const startedAt = activeTimer.startTime.toDate();
  // Se estava pausado, o fim real do trabalho é o momento da pausa, não agora.
  const endedAt = activeTimer.pausedAt ? activeTimer.pausedAt.toDate() : new Date();
  const durationSeconds = Math.round(computeElapsedMs(activeTimer, endedAt.getTime()) / 1000);
  const tasks = activeTimer.tasks ?? [];
  return {
    durationSeconds,
    data: {
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
      source: "timer" as const,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
  };
}

/** Inicia uma categoria; se havia cronômetro rodando, fecha-o como TimeEntry no
 * mesmo batch (comportamento idêntico ao app). Retorna a duração fechada. */
export async function startTimer(
  db: Firestore,
  uid: string,
  nextActionTypeId: string,
  current: { timer: ActiveTimer; actionTypeName: string } | null
): Promise<number | null> {
  const batch = writeBatch(db);
  let previousDurationSeconds: number | null = null;

  if (current) {
    const entryRef = doc(collection(db, "users", uid, "timeEntries"));
    const { data, durationSeconds } = buildEntryData(current.timer, current.actionTypeName);
    batch.set(entryRef, data);
    previousDurationSeconds = durationSeconds;
  }

  batch.set(activeTimerRef(db, uid), {
    actionTypeId: nextActionTypeId,
    startTime: serverTimestamp(),
    tasks: [],
    comments: null,
    description: null,
    pausedAt: null,
    accumulatedPausedSeconds: 0,
  });

  await batch.commit();
  return previousDurationSeconds;
}

export async function stopTimer(
  db: Firestore,
  uid: string,
  activeTimer: ActiveTimer,
  actionTypeName: string
): Promise<number> {
  const batch = writeBatch(db);
  const entryRef = doc(collection(db, "users", uid, "timeEntries"));
  const { data, durationSeconds } = buildEntryData(activeTimer, actionTypeName);
  batch.set(entryRef, data);
  batch.delete(activeTimerRef(db, uid));
  await batch.commit();
  return durationSeconds;
}

export async function pauseTimer(db: Firestore, uid: string, activeTimer: ActiveTimer) {
  if (activeTimer.pausedAt) return;
  await updateDoc(activeTimerRef(db, uid), { pausedAt: serverTimestamp() });
}

export async function resumeTimer(db: Firestore, uid: string, activeTimer: ActiveTimer) {
  if (!activeTimer.pausedAt) return;
  const pausedSpanSeconds = Math.max(
    0,
    Math.round((Date.now() - activeTimer.pausedAt.toMillis()) / 1000)
  );
  await updateDoc(activeTimerRef(db, uid), {
    pausedAt: null,
    accumulatedPausedSeconds: (activeTimer.accumulatedPausedSeconds ?? 0) + pausedSpanSeconds,
  });
}

export async function updateActiveTimerFields(
  db: Firestore,
  uid: string,
  patch: Partial<ActiveTimerFields>
) {
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
  await updateDoc(activeTimerRef(db, uid), normalized);
}

/** Anexa uma task ao cronômetro ativo, ignorando duplicata exata de referência. */
export async function addLinkedTask(
  db: Firestore,
  uid: string,
  activeTimer: ActiveTimer,
  task: LinkedTask
) {
  const existing = activeTimer.tasks ?? [];
  if (existing.some((t) => t.type === task.type && t.reference === task.reference)) return;
  await updateActiveTimerFields(db, uid, { tasks: [...existing, task] });
}

export async function discardTimer(db: Firestore, uid: string) {
  await deleteDoc(activeTimerRef(db, uid));
}
